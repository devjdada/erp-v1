import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Modal,
  TextInput,
  Alert
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { useRouter } from 'expo-router';
import { ArrowLeft, Hammer, Calendar, ClipboardList, PackageOpen, Wrench, Clock, Plus, X, Info, Hand } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { toolService } from '@/services/toolService';

const API_BASE_URL = 'https://oki.wchapel.com/api/v1';

interface Tool {
  id: number;
  tool_id: string;
  name: string;
  type: string;
  model: string | null;
  serial_number: string | null;
  status: 'available' | 'in-use' | 'maintenance' | string;
}

interface ToolRequest {
  id: number;
  tool: {
    name: string;
    tool_id: string;
  };
  request_type: string;
  status: 'pending' | 'approved' | 'rejected' | 'returned' | string;
  notes: string;
  created_at: string;
}

export default function ToolsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { authToken, user } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState<'inventory' | 'requests'>('inventory');
  const [tools, setTools] = useState<Tool[]>([]);
  const [requests, setRequests] = useState<ToolRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Request Modal State
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [selectedToolId, setSelectedToolId] = useState<number | null>(null);
  const [requestNotes, setRequestNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Add Tool Modal State
  const [addToolModalVisible, setAddToolModalVisible] = useState(false);
  const [newTool, setNewTool] = useState({ name: '', tool_id: '', type: 'Work Tool', model: '', serial_number: '' });
  const [addingTool, setAddingTool] = useState(false);

  // Resolve Modal State
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [resolveStatus, setResolveStatus] = useState('');
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  const fetchToolsData = useCallback(async (showLoader = false) => {
    if (!authToken) return;
    if (showLoader) setLoading(true);

    try {
      if (activeTab === 'inventory') {
        const result = await toolService.getTools();
        if (result && result.success && result.data) {
          setTools(result.data);
        }
      } else {
        const isAdmin = user?.role === 'admin' || user?.roles?.includes('admin');
        const result = await toolService.getRequests(isAdmin);
        if (result && result.success && result.data) {
          setRequests(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching tools details:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authToken, activeTab, user]);

  useEffect(() => {
    fetchToolsData(true);
  }, [fetchToolsData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchToolsData(false);
  };

  const handleRequestSubmit = async () => {
    if (!selectedToolId) {
        Alert.alert('Error', 'Please select a tool to request.');
        return;
    }
    
    setSubmitting(true);
    try {
        const result = await toolService.submitRequest({
            tool_id: selectedToolId,
            notes: requestNotes
        });
        
        if (result && result.success) {
            Alert.alert('Success', 'Tool request submitted successfully.');
            setRequestModalVisible(false);
            setSelectedToolId(null);
            setRequestNotes('');
            setActiveTab('requests');
            fetchToolsData(true);
        } else {
            Alert.alert('Error', result?.message || 'Failed to submit request');
        }
    } catch (err) {
        Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
        setSubmitting(false);
    }
  };

  const handleAddToolSubmit = async () => {
    if (!newTool.name || !newTool.tool_id) {
        Alert.alert('Error', 'Item Name and Tool ID are required.');
        return;
    }
    
    setAddingTool(true);
    try {
        const result = await toolService.addTool(newTool);
        
        if (result && result.success) {
            Alert.alert('Success', 'Tool added to inventory.');
            setAddToolModalVisible(false);
            setNewTool({ name: '', tool_id: '', type: 'Work Tool', model: '', serial_number: '' });
            setActiveTab('inventory');
            fetchToolsData(true);
        } else {
            Alert.alert('Error', result?.message || 'Failed to add tool. ' + (result?.errors ? JSON.stringify(result.errors) : ''));
        }
    } catch (err) {
        Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
        setAddingTool(false);
    }
  };

  const handleResolveSubmit = async () => {
    if (!selectedRequest || !resolveStatus) {
        Alert.alert('Error', 'Please select an outcome.');
        return;
    }
    setResolving(true);
    try {
        const result = await toolService.resolveRequest(selectedRequest.id, {
            status: resolveStatus,
            admin_notes: resolveNotes
        });
        if (result && result.success) {
            Alert.alert('Success', 'Request resolved.');
            setResolveModalVisible(false);
            setSelectedRequest(null);
            setResolveStatus('');
            setResolveNotes('');
            fetchToolsData(true);
        } else {
            Alert.alert('Error', result?.message || 'Failed to resolve request.');
        }
    } catch (err) {
        Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
        setResolving(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'available' || s === 'approved' || s === 'returned') return { bg: '#E0F2FE', text: '#0284C7', label: s };
    if (s === 'in-use' || s === 'pending') return { bg: '#FEF3C7', text: '#D97706', label: s };
    if (s === 'maintenance' || s === 'rejected') return { bg: '#FEE2E2', text: '#DC2626', label: s };
    return { bg: '#F1F5F9', text: '#475569', label: s || 'unknown' };
  };

  const availableTools = tools.filter(t => t.status?.toLowerCase() === 'available');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.headerBar, { backgroundColor: theme.background }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}>
          <ArrowLeft color={theme.text} size={24} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Tools</Text>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <Pressable onPress={() => setRequestModalVisible(true)} style={({ pressed }) => [styles.headerRightButton, pressed && { opacity: 0.7 }]}>
            <Hand color={theme.primary} size={24} />
          </Pressable>
          <Pressable onPress={() => setAddToolModalVisible(true)} style={({ pressed }) => [styles.headerRightButton, pressed && { opacity: 0.7 }]}>
            <Plus color={theme.primary} size={24} />
          </Pressable>
        </View>
      </View>

      {/* Segmented Control Tabs */}
      <View style={styles.tabContainer}>
        <View style={[styles.segmentedControl, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <Pressable
            onPress={() => setActiveTab('inventory')}
            style={[
              styles.segment,
              activeTab === 'inventory' && [styles.segmentActive, { backgroundColor: theme.text }]
            ]}
          >
            <Wrench size={16} color={activeTab === 'inventory' ? theme.background : theme.textSecondary} />
            <Text
              style={[
                styles.segmentText,
                { color: activeTab === 'inventory' ? theme.background : theme.textSecondary }
              ]}
            >
              Inventory
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('requests')}
            style={[
              styles.segment,
              activeTab === 'requests' && [styles.segmentActive, { backgroundColor: theme.text }]
            ]}
            >
              <Clock size={16} color={activeTab === 'requests' ? theme.background : theme.textSecondary} />
              <Text
                style={[
                  styles.segmentText,
                  { color: activeTab === 'requests' ? theme.background : theme.textSecondary }
                ]}
              >
                {(user?.role === 'admin' || user?.roles?.includes('admin')) ? 'Requests' : 'My Requests'}
              </Text>
            </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading tools...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} colors={[theme.primary]} />
          }
        >
          {activeTab === 'inventory' ? (
            tools.length > 0 ? (
              <View style={styles.listContainer}>
                {tools.map((tool) => {
                  const status = getStatusConfig(tool.status);
                  return (
                    <Pressable
                      key={tool.id}
                      style={({ pressed }) => [
                        styles.toolCard,
                        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                        pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
                      ]}
                    >
                      <View style={styles.cardHeader}>
                        <View style={styles.toolIdentity}>
                          <View style={[styles.avatarBox, { backgroundColor: theme.background }]}>
                            <Hammer color={theme.text} size={20} />
                          </View>
                          <View style={styles.toolInfo}>
                            <Text style={[styles.toolName, { color: theme.text }]}>{tool.name}</Text>
                            <Text style={[styles.toolCode, { color: theme.textSecondary }]}>
                              {tool.tool_id} • {tool.type}
                            </Text>
                          </View>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                          <Text style={[styles.statusText, { color: status.text }]}>
                            {status.label.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <View style={[styles.emptyIconBox, { backgroundColor: theme.backgroundElement }]}>
                  <PackageOpen color={theme.textSecondary} size={40} strokeWidth={1.5} />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>No tools found</Text>
                <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                  The tool inventory is currently empty or unavailable.
                </Text>
              </View>
            )
          ) : requests.length > 0 ? (
            <View style={styles.listContainer}>
              {requests.map((req) => {
                const status = getStatusConfig(req.status);
                return (
                  <Pressable
                    key={req.id}
                    style={({ pressed }) => [
                      styles.toolCard,
                      { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                      pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
                    ]}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.toolIdentity}>
                        <View style={[styles.avatarBox, { backgroundColor: theme.background }]}>
                          <ClipboardList color={theme.text} size={20} />
                        </View>
                        <View style={styles.toolInfo}>
                          <Text style={[styles.toolName, { color: theme.text }]} numberOfLines={1}>
                            {req.tool?.name || 'Unknown Tool'}
                          </Text>
                          <Text style={[styles.toolCode, { color: theme.textSecondary }]}>
                            Ref: {req.tool?.tool_id || 'N/A'}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                        <Text style={[styles.statusText, { color: status.text }]}>
                          {status.label.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.detailsSection, { backgroundColor: theme.background, borderColor: theme.border }]}>
                      <View style={styles.detailRow}>
                        <Info size={14} color={theme.textSecondary} />
                        <Text style={[styles.detailValue, { color: theme.text }]}>
                          Type: {req.request_type ? req.request_type.toUpperCase() : 'CHECKOUT'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardFooter}>
                      { (user?.role === 'admin' || user?.roles?.includes('admin')) && req.status?.toLowerCase() === 'pending' ? (
                        <Pressable 
                          onPress={() => {
                            setSelectedRequest(req);
                            setResolveStatus('');
                            setResolveNotes('');
                            setResolveModalVisible(true);
                          }}
                          style={{ backgroundColor: theme.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
                        >
                          <Text style={{ color: '#fff', fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold' }}>Review</Text>
                        </Pressable>
                      ) : null }
                      <Text style={[styles.dateText, { color: theme.textSecondary }]}>
                        Requested on {new Date(req.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconBox, { backgroundColor: theme.backgroundElement }]}>
                <ClipboardList color={theme.textSecondary} size={40} strokeWidth={1.5} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No requests found</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                You haven't made any tool or equipment requests yet.
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Request Modal */}
      <Modal visible={requestModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Request a Tool</Text>
              <Pressable onPress={() => setRequestModalVisible(false)} style={styles.closeButton}>
                <X color={theme.text} size={24} />
              </Pressable>
            </View>
            
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Select Available Tool</Text>
              <View style={styles.toolSelector}>
                  {availableTools.length > 0 ? availableTools.map(tool => (
                      <Pressable 
                          key={tool.id} 
                          style={[styles.selectableTool, { borderColor: theme.border }, selectedToolId === tool.id && { borderColor: theme.primary, backgroundColor: theme.primary + '15' }]}
                          onPress={() => setSelectedToolId(tool.id)}
                      >
                          <Text style={[styles.selectableToolName, { color: theme.text }]}>{tool.name}</Text>
                          <Text style={[styles.selectableToolCode, { color: theme.textSecondary }]}>{tool.tool_id} • {tool.type}</Text>
                      </Pressable>
                  )) : <Text style={{ color: theme.textSecondary, fontFamily: 'PlusJakartaSans_500Medium', marginTop: 10 }}>No tools currently available.</Text>}
              </View>

              <Text style={[styles.inputLabel, { color: theme.text, marginTop: 24 }]}>Notes / Reason (Optional)</Text>
              <TextInput
                  style={[styles.textInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
                  placeholder="Why do you need this tool?"
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  numberOfLines={4}
                  value={requestNotes}
                  onChangeText={setRequestNotes}
                  textAlignVertical="top"
              />
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
              <Pressable 
                  style={[styles.submitButton, { backgroundColor: theme.primary }, (!selectedToolId || submitting) && { opacity: 0.5 }]}
                  onPress={handleRequestSubmit}
                  disabled={!selectedToolId || submitting}
              >
                  {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Submit Request</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Tool Modal */}
      <Modal visible={addToolModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Add New Tool</Text>
              <Pressable onPress={() => setAddToolModalVisible(false)} style={styles.closeButton}>
                <X color={theme.text} size={24} />
              </Pressable>
            </View>
            
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              
              <Text style={[styles.inputLabel, { color: theme.text, marginTop: 16 }]}>Item Name *</Text>
              <TextInput
                  style={[styles.textInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement, minHeight: 48, paddingVertical: 12 }]}
                  placeholder="E.g. DeWalt Drill"
                  placeholderTextColor={theme.textSecondary}
                  value={newTool.name}
                  onChangeText={v => setNewTool(prev => ({ ...prev, name: v }))}
              />

              <Text style={[styles.inputLabel, { color: theme.text, marginTop: 16 }]}>Tool ID / Asset # *</Text>
              <TextInput
                  style={[styles.textInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement, minHeight: 48, paddingVertical: 12 }]}
                  placeholder="E.g. ASSET-001"
                  placeholderTextColor={theme.textSecondary}
                  value={newTool.tool_id}
                  onChangeText={v => setNewTool(prev => ({ ...prev, tool_id: v }))}
              />

              <Text style={[styles.inputLabel, { color: theme.text, marginTop: 16 }]}>Type</Text>
              <View style={styles.segmentedControlForm}>
                <Pressable
                    onPress={() => setNewTool(prev => ({ ...prev, type: 'Work Tool' }))}
                    style={[styles.segment, newTool.type === 'Work Tool' && [styles.segmentActiveForm, { backgroundColor: theme.primary }]]}
                >
                    <Text style={[styles.segmentTextForm, { color: newTool.type === 'Work Tool' ? '#fff' : theme.textSecondary }]}>Work Tool</Text>
                </Pressable>
                <Pressable
                    onPress={() => setNewTool(prev => ({ ...prev, type: 'Gadget' }))}
                    style={[styles.segment, newTool.type === 'Gadget' && [styles.segmentActiveForm, { backgroundColor: theme.primary }]]}
                >
                    <Text style={[styles.segmentTextForm, { color: newTool.type === 'Gadget' ? '#fff' : theme.textSecondary }]}>Gadget</Text>
                </Pressable>
              </View>

              <Text style={[styles.inputLabel, { color: theme.text, marginTop: 16 }]}>Model / Spec (Optional)</Text>
              <TextInput
                  style={[styles.textInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement, minHeight: 48, paddingVertical: 12 }]}
                  placeholder="E.g. DCD771C2"
                  placeholderTextColor={theme.textSecondary}
                  value={newTool.model}
                  onChangeText={v => setNewTool(prev => ({ ...prev, model: v }))}
              />

              <Text style={[styles.inputLabel, { color: theme.text, marginTop: 16 }]}>Serial Number (Optional)</Text>
              <TextInput
                  style={[styles.textInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement, minHeight: 48, paddingVertical: 12 }]}
                  placeholder="E.g. S/N 123456"
                  placeholderTextColor={theme.textSecondary}
                  value={newTool.serial_number}
                  onChangeText={v => setNewTool(prev => ({ ...prev, serial_number: v }))}
              />

              <View style={{ height: 40 }} />
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
              <Pressable 
                  style={[styles.submitButton, { backgroundColor: theme.primary }, (!newTool.name || !newTool.tool_id || addingTool) && { opacity: 0.5 }]}
                  onPress={handleAddToolSubmit}
                  disabled={!newTool.name || !newTool.tool_id || addingTool}
              >
                  {addingTool ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Add to Inventory</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Resolve Request Modal */}
      <Modal visible={resolveModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Review Request</Text>
              <Pressable onPress={() => setResolveModalVisible(false)} style={styles.closeButton}>
                <X color={theme.text} size={24} />
              </Pressable>
            </View>
            
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {selectedRequest && (
                <View style={{ backgroundColor: theme.backgroundElement, padding: 16, borderRadius: 12, marginBottom: 20 }}>
                  <Text style={{ color: theme.text, fontFamily: 'PlusJakartaSans_700Bold', marginBottom: 4 }}>
                    {selectedRequest.tool?.name} ({selectedRequest.tool?.tool_id})
                  </Text>
                  <Text style={{ color: theme.textSecondary, fontFamily: 'PlusJakartaSans_500Medium', marginBottom: 8 }}>
                    Requested by: {selectedRequest.staff?.user?.name || 'Unknown User'}
                  </Text>
                  <Text style={{ color: theme.textSecondary, fontFamily: 'PlusJakartaSans_500Medium' }}>
                    Notes: {selectedRequest.notes || 'N/A'}
                  </Text>
                </View>
              )}

              <Text style={[styles.inputLabel, { color: theme.text }]}>Outcome *</Text>
              <View style={styles.segmentedControlForm}>
                <Pressable
                    onPress={() => setResolveStatus('Approved')}
                    style={[styles.segment, resolveStatus === 'Approved' && [styles.segmentActiveForm, { backgroundColor: '#10B981' }]]}
                >
                    <Text style={[styles.segmentTextForm, { color: resolveStatus === 'Approved' ? '#fff' : theme.textSecondary }]}>Approve</Text>
                </Pressable>
                <Pressable
                    onPress={() => setResolveStatus('Rejected')}
                    style={[styles.segment, resolveStatus === 'Rejected' && [styles.segmentActiveForm, { backgroundColor: '#EF4444' }]]}
                >
                    <Text style={[styles.segmentTextForm, { color: resolveStatus === 'Rejected' ? '#fff' : theme.textSecondary }]}>Reject</Text>
                </Pressable>
              </View>

              <Text style={[styles.inputLabel, { color: theme.text, marginTop: 16 }]}>Admin Notes (Optional)</Text>
              <TextInput
                  style={[styles.textInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement, minHeight: 80, paddingVertical: 12 }]}
                  placeholder="Enter response notes..."
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  value={resolveNotes}
                  onChangeText={setResolveNotes}
              />
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
              <Pressable 
                  style={[styles.submitButton, { backgroundColor: theme.primary }, (!resolveStatus || resolving) && { opacity: 0.5 }]}
                  onPress={handleResolveSubmit}
                  disabled={!resolveStatus || resolving}
              >
                  {resolving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Submit Resolution</Text>}
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
    borderRadius: 12,
  },
  headerRightButton: {
    padding: 8,
    borderRadius: 12,
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 20,
    letterSpacing: -0.5,
  },
  tabContainer: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  segmentedControl: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 24,
    padding: 4,
    borderWidth: 1,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    gap: 8,
  },
  segmentActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
  },
  segmentedControlForm: {
    flexDirection: 'row',
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  segmentActiveForm: {
    borderRadius: 10,
  },
  segmentTextForm: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  listContainer: {
    gap: 16,
  },
  toolCard: {
    borderWidth: 1.5,
    borderRadius: 24,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  toolIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    paddingRight: 10,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolInfo: {
    flex: 1,
    gap: 2,
  },
  toolName: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
    letterSpacing: -0.3,
  },
  toolCode: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  detailsSection: {
    marginTop: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailValue: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 20,
    gap: 12,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    letterSpacing: -0.5,
  },
  emptySubtitle: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    minHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  modalTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 20,
    letterSpacing: -0.5,
  },
  closeButton: {
    padding: 4,
  },
  modalScroll: {
    paddingHorizontal: 24,
  },
  inputLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 15,
    marginBottom: 8,
  },
  toolSelector: {
    gap: 10,
  },
  selectableTool: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
  },
  selectableToolName: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 15,
    marginBottom: 4,
  },
  selectableToolCode: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
  },
  textInput: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 15,
  },
  modalFooter: {
    padding: 24,
    borderTopWidth: 1,
  },
  submitButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
  },
});

