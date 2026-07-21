import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  Image,
  Linking,
  Alert,
  ImageBackground,
  Animated
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import chatService from '../../services/chatService';
import { LinearGradient } from 'expo-linear-gradient';
import LeadWelcomeCard from '../../components/LeadWelcomeCard';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import apiService from '../../services/apiService';
import API_CONFIG, { resolveMediaUrl } from '../../config/apiConfig';
import { Modal } from 'react-native';


const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

const isNewDay = (currentMsgTime, previousMsgTime) => {
  if (!previousMsgTime) return true;
  const current = new Date(currentMsgTime);
  const previous = new Date(previousMsgTime);
  return current.toDateString() !== previous.toDateString();
};

const getDateSeparator = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  
  const options = { day: 'numeric', month: 'short' };
  return date.toLocaleDateString(undefined, options);
};

export default function ChatScreen({ route, navigation }) {
  const { threadId, campaign, business, buyer } = route.params;
  const { user } = useAuth();
  
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [threadStatus, setThreadStatus] = useState('WAITING');
  const [uploading, setUploading] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [sendingAction, setSendingAction] = useState(false);
  const [showCampaignDetails, setShowCampaignDetails] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [settingsMode, setSettingsMode] = useState('MAIN');
  const [retentionMode, setRetentionMode] = useState('Forever');
  const [toastMessage, setToastMessage] = useState(null);
  const [isPinned, setIsPinned] = useState(false);
  
  const flatListRef = useRef(null);
  const insets = useSafeAreaInsets();
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    fetchMessages();
    markRead();
    chatService.emitLocal('THREAD_READ', { threadId });
    
    chatService.connectWs();
    const unsubscribe = chatService.subscribe((data) => {
      if (data.type === 'MARK_READ' && data.thread_id === threadId) {
        setThreadStatus('VIEWED');
      } else if (data.type === 'TYPING' && data.thread_id === threadId) {
        // Handle typing
      } else if (data.id) {
        if (data.thread_id === threadId) {
          setMessages(prev => {
            if (prev.find(m => m.id === data.id)) return prev;
            return [...prev, data];
          });
          if (data.sender_id !== user.id) {
            setThreadStatus('REPLIED');
            chatService.markAsRead(threadId);
          }
          setTimeout(() => scrollToBottom(), 100);
        } else if (data.sender_id !== user.id && !data.is_system) {
          showToast(`New message from ${data.sender_role === 'SELLER' ? 'a Business' : 'a Buyer'}`);
        }
      }
    });

    const kbShow = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => {
      setKeyboardVisible(true);
      setShowAttachMenu(false);
      setTimeout(() => scrollToBottom(), 100);
    });
    
    const kbHide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => {
      setKeyboardVisible(false);
    });
    
    // Fetch pin status
    chatService.getPinnedThreads().then(pinned => {
      if (pinned.includes(threadId)) setIsPinned(true);
    });

    return () => {
      unsubscribe();
      kbShow.remove();
      kbHide.remove();
    };
  }, [threadId]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchMessages = async () => {
    try {
      const msgs = await chatService.getMessages(threadId);
      setMessages(msgs);
      const sellerReplies = msgs.filter(m => m.sender_role === 'SELLER' && !m.is_system);
      if (sellerReplies.length > 0) {
        setThreadStatus('REPLIED');
      }
    } catch (e) {
      console.log('Error fetching messages', e);
    } finally {
      setLoading(false);
      setTimeout(() => scrollToBottom(), 200);
    }
  };

  const markRead = async () => {
    try {
      await chatService.markAsRead(threadId);
    } catch (e) {}
  };

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  const sendMessageApi = async (body) => {
    const optimisticId = generateId();
    const optimisticMsg = {
      id: optimisticId,
      body: body,
      sender_id: user.id,
      sender_role: user.role,
      is_system: false,
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, optimisticMsg]);
    setTimeout(() => scrollToBottom(), 50);

    try {
      const actualMsg = await chatService.sendMessage(threadId, body);
      setMessages(prev => {
        if (prev.find(m => m.id === actualMsg.id)) {
          return prev.filter(m => m.id !== optimisticId);
        }
        return prev.map(m => m.id === optimisticId ? actualMsg : m);
      });
    } catch (e) {
      console.log('Failed to send message', e);
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
      Alert.alert('Error', 'Failed to send message.');
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const body = inputText.trim();
    setInputText('');
    await sendMessageApi(body);
  };

  const handleCall = () => {
    const phoneNumber = user?.role === 'SELLER' ? buyer?.phone : business?.phone;
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      Alert.alert('Not Available', 'No phone number provided.');
    }
  };

  const handleQuickAction = async (action) => {
    if (sendingAction) return;
    setSendingAction(true);
    let msgText = action.title;
    if (action.title.toLowerCase().includes('price') || action.title.toLowerCase().includes('pricing')) {
      msgText = "What's the price?";
    } else if (action.title.toLowerCase().includes('location') || action.title.toLowerCase().includes('direction')) {
      msgText = "Where is your location?";
    } else if (action.title.toLowerCase().includes('offer')) {
      msgText = "What are the current offers?";
    } else {
      msgText = `I'd like to know more about: ${action.title}`;
    }
    await sendMessageApi(msgText);
    setTimeout(() => setSendingAction(false), 2000);
  };

  const uploadFile = async (uri, name, type, isImage) => {
    try {
      setUploading(true);
      setShowAttachMenu(false);
      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        type: type || 'application/octet-stream',
        name: name || (isImage ? 'image.jpg' : 'document.pdf'),
      });
      const response = await apiService.post('/upload/image', formData);
      if (response && response.url) {
        let prefix = isImage ? '[ATTACHMENT:IMAGE]' : `[ATTACHMENT:DOCUMENT:${name}]`;
        await sendMessageApi(`${prefix}${response.url}`);
      }
    } catch (e) {
      Alert.alert('Upload Failed', 'There was an error uploading your file.');
      console.log('Upload error:', e);
    } finally {
      setUploading(false);
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission required", "Please grant camera roll permissions.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.8,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      const filename = asset.uri.split('/').pop();
      const mimeType = asset.type === 'video' ? 'video/mp4' : 'image/jpeg';
      uploadFile(asset.uri, filename, mimeType, asset.type !== 'video');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        uploadFile(asset.uri, asset.name, asset.mimeType, false);
      }
    } catch (err) {
      console.log("DocumentPicker Error:", err);
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const timeStr = isoString.endsWith('Z') || isoString.includes('+') ? isoString : `${isoString}Z`;
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) return '';
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const renderMessageBody = (body, isMe, time) => {
    const timeColor = isMe ? '#E2E8F0' : '#64748B'; // Whiteish for blue bg, gray for white bg
    if (body.startsWith('[ATTACHMENT:IMAGE]')) {
      const url = body.replace('[ATTACHMENT:IMAGE]', '');
      return (
        <View style={styles.imageBubbleContainer}>
          <Pressable onPress={() => Linking.openURL(resolveMediaUrl(url))}>
            <Image source={{ uri: resolveMediaUrl(url) }} style={styles.messageImage} />
          </Pressable>
          <View style={[styles.msgTimeRow, { position: 'absolute', bottom: 4, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 6, borderRadius: 10 }]}>
            <Text style={{ fontSize: 10, color: '#FFF' }}>{formatTime(time)}</Text>
            {isMe && <Ionicons name={threadStatus === 'VIEWED' ? 'checkmark-done' : 'checkmark'} size={12} color={threadStatus === 'VIEWED' ? '#34D399' : '#FFF'} style={{ marginLeft: 2 }} />}
          </View>
        </View>
      );
    }
    if (body.startsWith('[ATTACHMENT:DOCUMENT:')) {
      const parts = body.split(']');
      const filename = parts[0].replace('[ATTACHMENT:DOCUMENT:', '');
      const url = parts.slice(1).join(']');
      return (
        <View>
          <Pressable onPress={() => Linking.openURL(resolveMediaUrl(url))} style={[styles.documentCard, isMe ? styles.documentCardMe : styles.documentCardOther]}>
            <View style={styles.documentIconWrap}>
              <Ionicons name="document-text" size={24} color={isMe ? "#2563EB" : "#3B82F6"} />
            </View>
            <Text style={[styles.documentName, isMe ? styles.documentNameMe : styles.documentNameOther]} numberOfLines={1}>{filename}</Text>
          </Pressable>
          <View style={[styles.msgTimeRow, { alignSelf: 'flex-end', marginTop: 4 }]}>
            <Text style={{ fontSize: 10, color: timeColor }}>{formatTime(time)}</Text>
            {isMe && <Ionicons name={threadStatus === 'VIEWED' ? 'checkmark-done' : 'checkmark'} size={12} color={threadStatus === 'VIEWED' ? '#34D399' : timeColor} style={{ marginLeft: 2 }} />}
          </View>
        </View>
      );
    }
    return (
      <View style={styles.textBubbleContainer}>
        <Text style={[styles.msgText, isMe ? styles.msgTextMe : styles.msgTextOther]}>{body}</Text>
        <View style={styles.msgTimeRow}>
          <Text style={[styles.msgTime, { color: timeColor }]}>{formatTime(time)}</Text>
          {isMe && <Ionicons name={threadStatus === 'VIEWED' ? 'checkmark-done' : 'checkmark'} size={14} color={threadStatus === 'VIEWED' ? '#60A5FA' : '#94A3B8'} style={{ marginLeft: 2, marginBottom: -2 }} />}
        </View>
      </View>
    );
  };

  const renderMessage = ({ item, index }) => {
    const isMe = item.sender_id === user.id;
    const isSystem = item.is_system;

    const showDateSeparator = index === 0 || isNewDay(item.created_at, messages[index - 1].created_at);

    const messageContent = () => {
      if (isSystem) {
        if (user?.role === 'SELLER') return null;
        if (item.body.includes("created successfully")) {
          return (
            <LeadWelcomeCard 
              campaign={campaign} 
              business={business} 
              onQuickAction={handleQuickAction}
            />
          );
        }
        return (
          <View style={styles.systemMsgContainer}>
            <Text style={styles.systemMsgText}>{item.body}</Text>
          </View>
        );
      }
      
      const showSellerBranding = !isMe && item.sender_role === 'SELLER';
      const showBuyerBranding = !isMe && item.sender_role === 'BUYER';
      
      const isFirstInGroup = index === 0 || messages[index - 1].sender_id !== item.sender_id || messages[index - 1].is_system || showDateSeparator;

      const bubbleWrapper = (children) => {
        if (isMe) {
          return (
            <LinearGradient colors={['#3B82F6', '#2563EB']} style={[styles.msgBubble, styles.msgBubbleMe, !isFirstInGroup && { borderTopRightRadius: 4 }]}>
              {children}
            </LinearGradient>
          );
        }
        return (
          <View style={[styles.msgBubble, styles.msgBubbleOther, !isFirstInGroup && { borderTopLeftRadius: 4 }]}>
            {children}
          </View>
        );
      };

      return (
        <View style={[styles.msgWrapper, isMe ? styles.msgWrapperMe : styles.msgWrapperOther, isFirstInGroup ? { marginTop: 12 } : { marginTop: 4 }]}>
          <View style={[styles.msgContentCol, isMe ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
            {showSellerBranding && isFirstInGroup && (
              <View style={styles.senderNameRow}>
                <View style={styles.tinyAvatar}>
                  <Text style={styles.tinyAvatarText}>{(business?.name || 'B')[0]}</Text>
                </View>
                <Text style={styles.senderNameText}>{business?.name || item.sender_name || 'Business'}</Text>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" style={{ marginLeft: 4 }} />
              </View>
            )}
            
            {bubbleWrapper(renderMessageBody(item.body, isMe, item.created_at))}

            {showSellerBranding && user?.role === 'BUYER' && isFirstInGroup && (
              <View style={styles.smartActionsContainer}>
                {item.body.toLowerCase().includes('pricing') || item.body.toLowerCase().includes('price') ? (
                  <>
                    <Pressable style={styles.smartChip} onPress={() => handleQuickAction({title: 'Membership Plans'})}>
                      <Text style={styles.smartChipText}>Membership Plans</Text>
                    </Pressable>
                    <Pressable style={styles.smartChip} onPress={() => handleQuickAction({title: 'Current Offers'})}>
                      <Text style={styles.smartChipText}>Current Offers</Text>
                    </Pressable>
                  </>
                ) : item.body.toLowerCase().includes('located') || item.body.toLowerCase().includes('location') ? (
                  <>
                    <Pressable style={styles.smartChip} onPress={() => handleQuickAction({title: 'Business Hours'})}>
                      <Text style={styles.smartChipText}>Business Hours</Text>
                    </Pressable>
                    <Pressable style={styles.smartChip} onPress={() => handleQuickAction({title: 'Call Business'})}>
                      <Text style={styles.smartChipText}>Call Business</Text>
                    </Pressable>
                  </>
                ) : null}
              </View>
            )}
          </View>
        </View>
      );
    };

    return (
      <View>
        {showDateSeparator && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateSeparatorText}>{getDateSeparator(item.created_at)}</Text>
          </View>
        )}
        {messageContent()}
      </View>
    );
  };

  const getCampaignImage = () => {
    if (!campaign) return null;
    return campaign.image_urls?.[0] || campaign.image_url || null;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={0}
      >
        {/* Modern App Bar */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </Pressable>
          
          <View style={styles.headerProfileContainer}>
            {user?.role === 'BUYER' ? (
              <View style={styles.headerAvatarWrap}>
                 <Text style={styles.headerAvatarText}>{(business?.name || 'B')[0]?.toUpperCase()}</Text>
                 <View style={styles.verifiedBadge}><Ionicons name="checkmark" size={10} color="#FFF" /></View>
              </View>
            ) : (
              <View style={styles.headerAvatarWrap}>
                 <Text style={styles.headerAvatarText}>{(buyer?.name || 'B')[0]?.toUpperCase()}</Text>
                 <View style={styles.activeLeadBadge} />
              </View>
            )}
            
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>{user?.role === 'SELLER' ? (buyer?.name || 'Buyer') : (business?.name || 'Business')}</Text>
              <Text style={styles.headerSubtitle}>
                {user?.role === 'BUYER' ? 'Typically replies in 5m' : '🟢 Active Lead'}
              </Text>
            </View>
          </View>
          
          <View style={styles.headerActions}>
             <Pressable style={styles.headerActionBtn} onPress={handleCall}>
               <Ionicons name="call-outline" size={22} color="#0F172A" />
             </Pressable>
             <Pressable style={styles.headerActionBtn} onPress={() => { setSettingsMode('MAIN'); setShowSettingsMenu(true); }}>
               <Ionicons name="ellipsis-vertical" size={22} color="#0F172A" />
             </Pressable>
          </View>
        </View>


        {/* Chat Area Background */}
        <View style={styles.chatBackground}>
          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#2563EB" />
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={item => item.id.toString()}
              renderItem={renderMessage}
              contentContainerStyle={styles.listContent}
              onContentSizeChange={scrollToBottom}
              onLayout={scrollToBottom}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>

        {showAttachMenu && (
          <View style={styles.attachMenu}>
            <Pressable style={styles.attachOption} onPress={pickImage}>
              <View style={[styles.attachIconWrap, { backgroundColor: '#E0E7FF' }]}>
                <Ionicons name="image" size={24} color="#4F46E5" />
              </View>
              <Text style={styles.attachOptionText}>Photos/Videos</Text>
            </Pressable>
            <Pressable style={styles.attachOption} onPress={pickDocument}>
              <View style={[styles.attachIconWrap, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="document" size={24} color="#2563EB" />
              </View>
              <Text style={styles.attachOptionText}>Document</Text>
            </Pressable>
          </View>
        )}


        {/* Input Area */}
        <View style={[styles.inputContainer, { paddingBottom: isKeyboardVisible ? 12 : Math.max(insets.bottom, 12) }]}>
          <Pressable style={styles.attachBtn} onPress={() => setShowAttachMenu(!showAttachMenu)}>
            <Ionicons name={showAttachMenu ? "close" : "add"} size={26} color="#64748B" />
          </Pressable>
          
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor="#94A3B8"
            multiline
            maxLength={1000}
            onFocus={() => {
              setShowAttachMenu(false);
              scrollToBottom();
            }}
          />
          
          {inputText.trim() ? (
            <Pressable onPress={handleSend} style={styles.sendBtn} disabled={uploading}>
              {uploading ? (
                <View style={[styles.sendGradient, { backgroundColor: '#CBD5E1' }]}>
                  <ActivityIndicator size="small" color="#FFF" />
                </View>
              ) : (
                <View style={[styles.sendGradient, { backgroundColor: '#2563EB' }]}>
                  <Ionicons name="send" size={16} color="#FFF" style={{ marginLeft: 3 }} />
                </View>
              )}
            </Pressable>
          ) : (
            <Pressable onPress={pickImage} style={styles.sendBtn}>
              <View style={[styles.sendGradient, { backgroundColor: '#F1F5F9' }]}>
                <Ionicons name="camera" size={20} color="#64748B" />
              </View>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Conversation Settings Bottom Sheet */}
      <Modal
        visible={showSettingsMenu}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSettingsMenu(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowSettingsMenu(false)} />
          <View style={styles.bottomSheet}>
            {settingsMode === 'MAIN' ? (
              <>
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>Manage Conversation</Text>
                  <Pressable onPress={() => setShowSettingsMenu(false)}>
                    <Ionicons name="close" size={24} color="#64748B" />
                  </Pressable>
                </View>
                <View style={styles.sheetContent}>
                  <Pressable style={styles.sheetOption} onPress={async () => { 
                    setShowSettingsMenu(false); 
                    const nowPinned = await chatService.togglePin(threadId);
                    setIsPinned(nowPinned);
                    showToast(nowPinned ? 'Conversation pinned.' : 'Conversation unpinned.'); 
                  }}>
                    <Ionicons name={isPinned ? "pin" : "pin-outline"} size={20} color="#334155" style={styles.sheetIcon} />
                    <Text style={styles.sheetOptionText}>{isPinned ? 'Unpin Conversation' : 'Pin Conversation'}</Text>
                  </Pressable>
                  <Pressable style={styles.sheetOption} onPress={() => { setShowSettingsMenu(false); showToast('Notifications muted.'); }}>
                    <Ionicons name="notifications-off-outline" size={20} color="#334155" style={styles.sheetIcon} />
                    <Text style={styles.sheetOptionText}>Mute Notifications</Text>
                  </Pressable>
                  <Pressable style={styles.sheetOption} onPress={() => setSettingsMode('HISTORY')}>
                    <Ionicons name="time-outline" size={20} color="#334155" style={styles.sheetIcon} />
                    <Text style={styles.sheetOptionText}>Chat History</Text>
                    <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                  </Pressable>
                  <Pressable style={styles.sheetOption} onPress={() => {
                    Alert.alert('Delete Conversation?', 'Deleting this conversation will permanently remove all messages from your account.\n\nThis action cannot be undone.', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => { setShowSettingsMenu(false); navigation.goBack(); } }
                    ]);
                  }}>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" style={styles.sheetIcon} />
                    <Text style={[styles.sheetOptionText, { color: '#EF4444' }]}>Delete Conversation</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <View style={styles.sheetHeader}>
                  <Pressable onPress={() => setSettingsMode('MAIN')}>
                    <Ionicons name="arrow-back" size={24} color="#64748B" />
                  </Pressable>
                  <Text style={styles.sheetTitle}>Chat History Retention</Text>
                  <Pressable onPress={() => setShowSettingsMenu(false)}>
                    <Ionicons name="close" size={24} color="#64748B" />
                  </Pressable>
                </View>
                <View style={styles.sheetContent}>
                  <Text style={styles.sheetSubtitle}>
                    Choose how long you would like to keep this conversation available. Changing this setting only affects this conversation and can be updated at any time.
                  </Text>
                  
                  <View style={styles.retentionOptions}>
                    {['1 Week', '1 Month', '3 Months', '6 Months', 'Forever'].map(opt => (
                      <Pressable key={opt} style={styles.radioOption} onPress={() => setRetentionMode(opt)}>
                        <View style={[styles.radioCircle, retentionMode === opt && styles.radioCircleSelected]}>
                          {retentionMode === opt && <View style={styles.radioInner} />}
                        </View>
                        <View style={styles.radioTextWrap}>
                          <Text style={styles.radioTitle}>Keep {opt === 'Forever' ? 'Forever' : `for ${opt}`}</Text>
                          <Text style={styles.radioDesc}>
                            {opt === '1 Week' ? 'Ideal for short-term enquiries.' :
                             opt === '1 Month' ? 'Recommended for active campaigns.' :
                             opt === '3 Months' ? 'Useful for ongoing customer discussions.' :
                             opt === '6 Months' ? 'Suitable for long-term business communication.' :
                             'Your conversation will remain available until you choose to delete it manually.'}
                          </Text>
                        </View>
                        {opt === 'Forever' && (
                          <View style={styles.recommendedBadge}>
                            <Text style={styles.recommendedBadgeText}>Recommended</Text>
                          </View>
                        )}
                      </Pressable>
                    ))}
                  </View>

                  <View style={styles.infoCard}>
                    <Ionicons name="information-circle" size={20} color="#3B82F6" />
                    <Text style={styles.infoCardText}>
                      Your conversations may contain quotations, offers, and important business discussions. Keeping your chat history helps you easily revisit previous conversations whenever needed.
                    </Text>
                  </View>

                  <View style={styles.sheetActionRow}>
                    <Pressable style={styles.sheetBtnSecondary} onPress={() => setSettingsMode('MAIN')}>
                      <Text style={styles.sheetBtnSecondaryText}>Cancel</Text>
                    </Pressable>
                    <Pressable style={styles.sheetBtnPrimary} onPress={() => {
                      setShowSettingsMenu(false);
                      showToast('✓ Chat history preference updated successfully.');
                    }}>
                      <Text style={styles.sheetBtnPrimaryText}>Save Preference</Text>
                    </Pressable>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {toastMessage && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF', // Header color
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    zIndex: 10,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitleContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  campaignStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 9,
  },
  campaignStripImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#E2E8F0',
  },
  campaignStripInfo: {
    flex: 1,
  },
  campaignStripTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  campaignStripOffer: {
    fontSize: 12,
    color: '#10B981', // Green for offer
    fontWeight: '500',
    marginTop: 2,
  },
  chatBackground: {
    flex: 1,
    backgroundColor: '#F0F2F5', // WhatsApp-like light gray/greenish tint
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  msgWrapper: {
    flexDirection: 'row',
    marginBottom: 2,
    alignItems: 'flex-end',
  },
  msgWrapperMe: {
    justifyContent: 'flex-end',
  },
  msgWrapperOther: {
    justifyContent: 'flex-start',
  },
  msgContentCol: {
    maxWidth: '85%',
  },
  senderNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    marginLeft: 4,
  },
  senderNameText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  msgBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  msgBubbleMe: {
    backgroundColor: '#E7F8E5', // WhatsApp light green
    borderBottomRightRadius: 4,
  },
  msgBubbleOther: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  textBubbleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  },
  msgText: {
    fontSize: 15,
    lineHeight: 22,
  },
  msgTextMe: {
    color: '#111B21',
  },
  msgTextOther: {
    color: '#111B21',
  },
  msgTime: {
    fontSize: 10,
    marginLeft: 8,
    marginBottom: -2, // Pull down to align with bottom of text
  },
  msgTimeMe: {
    color: '#667781',
  },
  msgTimeOther: {
    color: '#667781',
  },
  imageBubbleContainer: {
    position: 'relative',
  },
  messageImage: {
    width: 220,
    height: 220,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  smartActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 6,
  },
  smartChip: {
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  smartChipText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '500',
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    width: 200,
  },
  documentCardMe: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  documentCardOther: {
    backgroundColor: '#F1F5F9',
  },
  documentIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  documentNameMe: {
    color: '#111B21',
  },
  documentNameOther: {
    color: '#111B21',
  },
  systemMsgContainer: {
    backgroundColor: '#FEF3C7', // Amber warning light
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'center',
    marginVertical: 12,
    maxWidth: '90%',
  },
  systemMsgText: {
    color: '#92400E',
    fontSize: 12,
    textAlign: 'center',
  },
  attachMenu: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F0F2F5',
    justifyContent: 'space-around',
  },
  attachOption: {
    alignItems: 'center',
  },
  attachIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  attachOptionText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: '#F0F2F5', // Seamless match with chat background
  },
  attachBtn: {
    padding: 8,
    marginRight: 4,
    marginBottom: 2,
  },
  input: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    minHeight: 44,
    maxHeight: 120,
    color: '#0F172A',
  },
  sendBtn: {
    marginLeft: 12,
    marginBottom: 2,
  },
  sendGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  msgTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    alignSelf: 'flex-end',
  },
  tinyAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  tinyAvatarText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  dateSeparator: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginVertical: 12,
  },
  dateSeparatorText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  headerProfileContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  headerAvatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginRight: 10,
  },
  headerAvatarText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#10B981',
    borderRadius: 8,
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFF',
  },
  activeLeadBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#10B981',
    borderRadius: 6,
    width: 12,
    height: 12,
    borderWidth: 2,
    borderColor: '#FFF',
},
  headerActions: {
    flexDirection: 'row',
  },
  headerActionBtn: {
    marginLeft: 16,
  },
  animatedHeaderWrap: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    zIndex: 9,
    overflow: 'hidden',
  },
  campaignContextCard: {
    padding: 16,
    flex: 1,
  },
  campaignCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 30, // Keep header row compact
  },
  campaignContextImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#E2E8F0',
  },
  campaignContextInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  campaignCategoryBadge: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  campaignCategoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#EA580C',
  },
  campaignContextTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 22,
  },
  campaignContextOffer: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '500',
    marginTop: 2,
  },
  campaignCardExpanded: {
    marginTop: 12,
  },
  campaignPriceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563EB',
    marginBottom: 4,
  },
  campaignDetailText: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 2,
  },
  campaignViewBtn: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  campaignViewBtnTextWrap: {
    marginTop: 8,
  },
  campaignViewBtnTextRaw: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 14,
  },
  campaignViewBtnText: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  persistentSnapshot: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  snapshotInfo: {
    flex: 1,
  },
  snapshotTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  snapshotOffer: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  snapshotBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  snapshotBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  bottomSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  sheetContent: {
    marginTop: 4,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sheetIcon: {
    marginRight: 14,
  },
  sheetOptionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#334155',
  },
  sheetSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
    lineHeight: 20,
  },
  retentionOptions: {
    marginBottom: 20,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  radioCircleSelected: {
    borderColor: '#2563EB',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
  },
  radioTextWrap: {
    flex: 1,
  },
  radioTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  radioDesc: {
    fontSize: 13,
    color: '#64748B',
  },
  recommendedBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  recommendedBadgeText: {
    fontSize: 10,
    color: '#2563EB',
    fontWeight: '700',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoCardText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  sheetActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheetBtnSecondary: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
  },
  sheetBtnSecondaryText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '600',
  },
  sheetBtnPrimary: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  sheetBtnPrimaryText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  toastContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    left: 20,
    right: 20,
    backgroundColor: '#1E293B',
    padding: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    alignItems: 'center',
  },
  toastText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  }
});

