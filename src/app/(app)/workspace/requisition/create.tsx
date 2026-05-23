import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { useRouter } from 'expo-router';
import { ArrowLeft, Save, Plus, Trash2, Calendar, PackageOpen } from 'lucide-react-native';
import requisitionService, { RequisitionOptions, RequisitionPayload } from '@/services/requisitionService';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function CreateRequisitionScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [options, setOptions] = useState<RequisitionOptions | null>(null);

  // Form State
  const [type, setType] = useState('Project');
  const [projectId, setProjectId] = useState<number | ''>('');
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [priority, setPriority] = useState('Medium');
  const [requiredDate, setRequiredDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [justification, setJustification] = useState('');

  // Items State
  const [items, setItems] = useState([
    { description: '', uom: 'pcs', quantity_requested: '1', specification: '' }
  ]);

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      const result = await requisitionService.getCreateOptions();
      if (result.status === 'success') {
        setOptions(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch options', error);
      Alert.alert('Error', 'Failed to load form options');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setItems([...items, { description: '', uom: 'pcs', quantity_requested: '1', specification: '' }]);
  };

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const validateForm = () => {
    if (!options?.next_requisition_number) {
      Alert.alert('Validation', 'Missing requisition number');
      return false;
    }
    if ((type === 'Project' || type === 'Site') && !projectId) {
      Alert.alert('Validation', 'Please select a project');
      return false;
    }
    if (type === 'Department' && !departmentId) {
      Alert.alert('Validation', 'Please select a department');
      return false;
    }
    for (const item of items) {
      const qty = parseFloat(item.quantity_requested);
      if (!item.description || !item.uom || !item.quantity_requested || isNaN(qty) || qty <= 0) {
        Alert.alert('Validation', 'All items must have a description, UOM, and valid quantity');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitting(true);

    try {
      const payload: RequisitionPayload = {
        requisition_number: options!.next_requisition_number,
        type,
        project_id: (type === 'Project' || type === 'Site') && projectId ? Number(projectId) : undefined,
        department_id: type === 'Department' && departmentId ? Number(departmentId) : undefined,
        required_date: `${requiredDate.getFullYear()}-${String(requiredDate.getMonth() + 1).padStart(2, '0')}-${String(requiredDate.getDate()).padStart(2, '0')}`,
        priority,
        justification,
        items: items.map(item => ({
          description: item.description,
          uom: item.uom,
          quantity_requested: parseFloat(item.quantity_requested),
          specification: item.specification,
        })),
      };

      const result = await requisitionService.store(payload);
      if (result.status === 'success') {
        Alert.alert('Success', 'Requisition created successfully', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit requisition');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.headerBar, { backgroundColor: theme.backgroundElement, borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={theme.text} size={24} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>New Requisition</Text>
        <Pressable onPress={handleSubmit} disabled={submitting} style={styles.submitButton}>
          {submitting ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <Save color={theme.primary} size={24} />
          )}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Basic Details */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Details</Text>
          <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Requisition Number</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border, opacity: 0.7 }]}
                value={options?.next_requisition_number}
                editable={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Type</Text>
              <View style={styles.tabGroup}>
                {['Project', 'Department', 'Site'].map(t => (
                  <Pressable
                    key={t}
                    style={[
                      styles.tab,
                      { borderColor: theme.border },
                      type === t && { backgroundColor: theme.primary, borderColor: theme.primary }
                    ]}
                    onPress={() => setType(t)}
                  >
                    <Text style={[styles.tabText, { color: type === t ? '#fff' : theme.text }]}>{t}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {(type === 'Project' || type === 'Site') && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Project</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
                  {options?.projects.map((proj: any) => (
                    <Pressable
                      key={proj.id}
                      style={[
                        styles.pill,
                        { borderColor: theme.border, backgroundColor: theme.background },
                        projectId === proj.id && { backgroundColor: theme.primary + '15', borderColor: theme.primary }
                      ]}
                      onPress={() => setProjectId(proj.id)}
                    >
                      <Text style={[
                        styles.pillText,
                        { color: theme.text },
                        projectId === proj.id && { color: theme.primary, fontFamily: 'PlusJakartaSans_700Bold' }
                      ]}>{proj.title}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            {type === 'Department' && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Department</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
                  {options?.departments.map((dept: any) => (
                    <Pressable
                      key={dept.id}
                      style={[
                        styles.pill,
                        { borderColor: theme.border, backgroundColor: theme.background },
                        departmentId === dept.id && { backgroundColor: theme.primary + '15', borderColor: theme.primary }
                      ]}
                      onPress={() => setDepartmentId(dept.id)}
                    >
                      <Text style={[
                        styles.pillText,
                        { color: theme.text },
                        departmentId === dept.id && { color: theme.primary, fontFamily: 'PlusJakartaSans_700Bold' }
                      ]}>{dept.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Required Date</Text>
              <Pressable
                style={[styles.dateButton, { backgroundColor: theme.background, borderColor: theme.border }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar size={18} color={theme.textSecondary} />
                <Text style={{ color: theme.text, fontFamily: 'PlusJakartaSans_500Medium' }}>
                  {requiredDate.toLocaleDateString()}
                </Text>
              </Pressable>
              {showDatePicker && (
                <DateTimePicker
                  value={requiredDate}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) setRequiredDate(selectedDate);
                  }}
                />
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Priority</Text>
              <View style={styles.tabGroup}>
                {['Low', 'Medium', 'High', 'Critical'].map(p => (
                  <Pressable
                    key={p}
                    style={[
                      styles.tab,
                      { borderColor: theme.border, flex: 1 },
                      priority === p && { backgroundColor: theme.primary, borderColor: theme.primary }
                    ]}
                    onPress={() => setPriority(p)}
                  >
                    <Text style={[styles.tabText, { color: priority === p ? '#fff' : theme.text, fontSize: 11 }]}>{p}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Justification (Optional)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border, height: 80 }]}
                value={justification}
                onChangeText={setJustification}
                placeholder="Why are these items needed?"
                placeholderTextColor={theme.textSecondary}
                multiline
                textAlignVertical="top"
              />
            </View>

          </View>
        </View>

        {/* Items */}
        <View style={styles.section}>
          <View style={styles.itemsHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>Materials Needed</Text>
            <Pressable onPress={addItem} style={[styles.addItemBtn, { backgroundColor: theme.primary + '15' }]}>
              <Plus size={16} color={theme.primary} />
              <Text style={[styles.addItemText, { color: theme.primary }]}>Add Item</Text>
            </Pressable>
          </View>

          {items.map((item, index) => (
            <View key={index} style={[styles.itemCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <View style={styles.itemHeader}>
                <View style={styles.itemBadge}>
                  <PackageOpen size={14} color={theme.primary} />
                  <Text style={[styles.itemIndex, { color: theme.primary }]}>Item {index + 1}</Text>
                </View>
                {items.length > 1 && (
                  <Pressable onPress={() => removeItem(index)} style={styles.deleteBtn}>
                    <Trash2 size={16} color="#EF4444" />
                  </Pressable>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Description</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  value={item.description}
                  onChangeText={(text) => updateItem(index, 'description', text)}
                  placeholder="Material name / description"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>Quantity</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                    value={item.quantity_requested}
                    onChangeText={(text) => updateItem(index, 'quantity_requested', text)}
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>UOM</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                    value={item.uom}
                    onChangeText={(text) => updateItem(index, 'uom', text)}
                    placeholder="pcs, kg, m, etc."
                    placeholderTextColor={theme.textSecondary}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Specification (Optional)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  value={item.specification}
                  onChangeText={(text) => updateItem(index, 'specification', text)}
                  placeholder="Brand, size, color, etc."
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
            </View>
          ))}
        </View>

        <Pressable
          style={[
            styles.primaryButton,
            { backgroundColor: theme.primary, opacity: submitting ? 0.7 : 1 }
          ]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.primaryButtonText}>Submit Requisition</Text>
          )}
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  submitButton: {
    padding: 8,
    marginRight: -8,
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 15,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14,
  },
  tabGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
  },
  pillScroll: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  pill: {
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
  },
  pillText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addItemText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 12,
  },
  itemCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#00339915',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  itemIndex: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 12,
  },
  deleteBtn: {
    padding: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
    color: '#FFF',
  },
});
