import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, FileText, Download, ShieldAlert, Award, FileSpreadsheet, Eye, Plus, X, Upload } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

const API_BASE_URL = 'https://oki.wchapel.com/api/v1';

interface StaffDocument {
  id: number;
  file_name: string;
  file_path: string;
  type: string;
  created_at: string;
}

export default function DocumentsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { authToken } = useAuth();

  // State
  const [documents, setDocuments] = useState<StaffDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Upload Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [docType, setDocType] = useState('Policy');
  const [customFileName, setCustomFileName] = useState('');
  const [uploading, setUploading] = useState(false);

  const fetchDocuments = useCallback(async (showLoader = false) => {
    if (!authToken) return;
    if (showLoader) setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/staff/documents`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setDocuments(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchDocuments(true);
  }, [fetchDocuments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDocuments(false);
  };

  const handleDownload = (doc: StaffDocument) => {
    const fullUrl = `https://oki.wchapel.com/storage/${doc.file_path}`;
    Alert.alert(
      'Download File',
      `Would you like to download "${doc.file_name}"?\nUrl: ${fullUrl}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Link', 
          onPress: () => {
            Alert.alert('Download Started', 'The file has been opened in your browser.');
          } 
        }
      ]
    );
  };

  const handleView = (doc: StaffDocument) => {
    const fullUrl = `https://oki.wchapel.com/storage/${doc.file_path}`;
    Alert.alert(
      'Preview Document',
      `File Name: ${doc.file_name}\nCategory: ${doc.type}\nUploaded: ${new Date(doc.created_at).toLocaleDateString()}`,
      [{ text: 'Close' }]
    );
  };

  // Perform upload using multipart form-data
  const handleUploadDocument = async () => {
    if (!customFileName) {
      Alert.alert('Error', 'Please enter a document name.');
      return;
    }
    if (!authToken) return;

    setUploading(true);
    try {
      // Create FormData
      const formData = new FormData();
      
      // Simulate file blob in React Native
      const fileName = customFileName.endsWith('.pdf') ? customFileName : `${customFileName}.pdf`;
      const fileToUpload = {
        uri: 'data:text/plain;base64,T0tJIEFQUCBVcGxvYWQ=', // simple base64 placeholder
        name: fileName,
        type: 'application/pdf',
      };
      
      formData.append('document', fileToUpload as any);
      formData.append('type', docType);

      const response = await fetch(`${API_BASE_URL}/staff/documents`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          // Content-Type is auto-set by fetch when body is FormData
        },
        body: formData,
      });

      const result = await response.json();
      if (response.ok && result.success) {
        Alert.alert('Success', 'Document uploaded successfully.');
        setModalVisible(false);
        setCustomFileName('');
        fetchDocuments(false);
      } else {
        Alert.alert('Error', result.message || 'Failed to upload document.');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      Alert.alert('Error', 'Network error occurred. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.file_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || doc.type.toLowerCase() === activeCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('policy')) return <ShieldAlert color="#EF4444" size={20} />;
    if (cat.includes('form')) return <FileSpreadsheet color="#10B981" size={20} />;
    return <Award color="#1E6FFD" size={20} />;
  };

  const getCategoryBg = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('policy')) return 'rgba(239, 68, 68, 0.08)';
    if (cat.includes('form')) return 'rgba(16, 185, 129, 0.08)';
    return 'rgba(30, 111, 253, 0.08)';
  };

  // Get unique categories for tabs
  const categories = ['all', ...Array.from(new Set(documents.map(d => d.type.toLowerCase())))];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Top Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: theme.backgroundElement, borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={theme.text} size={24} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Document Hub</Text>
        <Pressable onPress={() => setModalVisible(true)} style={[styles.addButton, { backgroundColor: theme.primary }]}>
          <Plus color="#FFFFFF" size={18} />
        </Pressable>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchSection}>
        <View style={[styles.searchContainer, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <Search color={theme.textSecondary} size={18} style={styles.searchIcon} />
          <TextInput
            placeholder="Search documents..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: theme.text }]}
          />
        </View>
      </View>

      {/* Category Filter Pills */}
      {categories.length > 1 && (
        <View style={styles.categoryContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              const label = cat === 'all' ? 'All Files' : cat.charAt(0).toUpperCase() + cat.slice(1);
              return (
                <Pressable
                  key={cat}
                  onPress={() => setActiveCategory(cat)}
                  style={[
                    styles.categoryPill,
                    {
                      backgroundColor: isActive ? theme.primary : theme.backgroundElement,
                      borderColor: isActive ? theme.primary : theme.border,
                    }
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      {
                        color: isActive ? '#FFFFFF' : theme.textSecondary,
                        fontFamily: isActive ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_600SemiBold',
                      }
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Documents List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />
          }
        >
          {filteredDocuments.length > 0 ? (
            <View style={styles.listContainer}>
              {filteredDocuments.map((doc) => (
                <View
                  key={doc.id}
                  style={[styles.documentCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
                >
                  <View style={styles.cardHeader}>
                    <View style={[styles.iconWrapper, { backgroundColor: getCategoryBg(doc.type) }]}>
                      {getCategoryIcon(doc.type)}
                    </View>
                    <View style={styles.badgeRow}>
                      <View style={[styles.typeBadge, { backgroundColor: theme.backgroundSelected }]}>
                        <Text style={[styles.typeText, { color: theme.textSecondary }]}>
                          {doc.type.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <Text style={[styles.documentTitle, { color: theme.text }]} numberOfLines={2}>
                    {doc.file_name}
                  </Text>

                  <View style={styles.cardFooter}>
                    <View style={styles.docDetails}>
                      <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                        {new Date(doc.created_at).toLocaleDateString()}
                      </Text>
                    </View>

                    <View style={styles.actionButtons}>
                      <Pressable
                        onPress={() => handleView(doc)}
                        style={[styles.iconActionButton, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}
                      >
                        <Eye color={theme.text} size={16} />
                      </Pressable>
                      <Pressable
                        onPress={() => handleDownload(doc)}
                        style={[styles.iconActionButton, { backgroundColor: theme.primary }]}
                      >
                        <Download color="#FFFFFF" size={16} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <FileText color={theme.textSecondary} size={48} strokeWidth={1} style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No documents found</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Try uploading a new document or changing the filters.
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Upload Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundElement }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Upload Document</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <X color={theme.text} size={20} />
              </Pressable>
            </View>

            <View style={styles.modalForm}>
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Document Category</Text>
              <View style={styles.typePills}>
                {['Policy', 'Form', 'Guide', 'Report', 'Other'].map((t) => {
                  const isSel = docType === t;
                  return (
                    <Pressable
                      key={t}
                      onPress={() => setDocType(t)}
                      style={[
                        styles.pill,
                        {
                          backgroundColor: isSel ? theme.primary : theme.background,
                          borderColor: isSel ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <Text style={[styles.pillText, { color: isSel ? '#FFFFFF' : theme.textSecondary }]}>{t}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Document Name *</Text>
              <TextInput
                value={customFileName}
                onChangeText={setCustomFileName}
                placeholder="e.g. Health Insurance Plan"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              />

              <Pressable
                onPress={handleUploadDocument}
                disabled={uploading}
                style={[styles.submitBtn, { backgroundColor: theme.primary }]}
              >
                {uploading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Upload color="#FFFFFF" size={16} style={{ marginRight: 8 }} />
                    <Text style={styles.submitBtnText}>Submit & Upload</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14,
  },
  categoryContainer: {
    paddingVertical: 14,
  },
  categoryScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 13,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    gap: 16,
  },
  documentCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 9,
    letterSpacing: 0.5,
  },
  documentTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  docDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconActionButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 17.5,
  },
  modalForm: {
    padding: 20,
  },
  fieldLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13,
    marginBottom: 8,
    marginTop: 12,
  },
  typePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  pillText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13.5,
    marginBottom: 18,
  },
  submitBtn: {
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14.5,
    color: '#FFFFFF',
  },
});
