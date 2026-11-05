// app/src/screens/ItemsScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  useWindowDimensions,
  Modal,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { listItems, createItem, adjustStock } from '../services/items';
import { Item } from '../types';
import { formatMoney, toPaise } from '../lib/money';
import Card from '../components/Card';
import { colors, fonts } from '../theme';
import { useAuth } from '../context/AuthContext';

export default function ItemsScreen() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const insets = useSafeAreaInsets();
  const { currentBusiness } = useAuth();
  const businessId = currentBusiness?.id || 'b-1';

  const [items, setItems] = useState<Item[]>([]);
  const [filterChip, setFilterChip] = useState<'all' | 'low_stock'>('all');
  const [search, setSearch] = useState('');

  // Add Item Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [hsn, setHsn] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [salePrice, setSalePrice] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [gstRate, setGstRate] = useState('5');
  const [stockQty, setStockQty] = useState('');
  const [lowStockLimit, setLowStockLimit] = useState('10');

  // Item Action / Barcode Modal State
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState<'add' | 'deduct'>('add');

  useEffect(() => {
    listItems(businessId).then(setItems);
  }, [businessId]);

  const filteredItems = items.filter((item) => {
    const matchesFilter =
      filterChip === 'all' ? true : item.stock_qty <= item.low_stock_limit;
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.hsn && item.hsn.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const handleAddItem = async () => {
    if (!name) return;
    const sPricePaise = toPaise(parseFloat(salePrice) || 0);
    const pPricePaise = toPaise(parseFloat(purchasePrice) || 0);
    const created = await createItem({
      business_id: businessId,
      name,
      hsn: hsn || '1000',
      unit: unit || 'pcs',
      sale_price: sPricePaise,
      purchase_price: pPricePaise,
      gst_rate: parseFloat(gstRate) || 0,
      stock_qty: parseInt(stockQty, 10) || 0,
      low_stock_limit: parseInt(lowStockLimit, 10) || 10,
    });
    setItems((prev) => [...prev, created]);
    setName('');
    setHsn('');
    setSalePrice('');
    setPurchasePrice('');
    setStockQty('');
    setAddModalOpen(false);
  };

  const handleAdjustStock = async () => {
    if (!selectedItem || !adjustQty) return;
    const num = parseInt(adjustQty, 10) || 0;
    const delta = adjustReason === 'add' ? num : -num;
    await adjustStock(selectedItem.id, delta, 'Manual stock adjustment');
    setItems((prev) =>
      prev.map((it) =>
        it.id === selectedItem.id ? { ...it, stock_qty: it.stock_qty + delta } : it
      )
    );
    setSelectedItem(null);
    setAdjustQty('');
  };

  const getStatusBadge = (item: Item) => {
    if (item.stock_qty <= 0) {
      return {
        label: 'Out of stock',
        bg: '#FEE2E2',
        color: '#991B1B',
      };
    }
    if (item.stock_qty <= item.low_stock_limit) {
      return {
        label: 'Low stock',
        bg: '#FEF3C7',
        color: '#92400E',
      };
    }
    return {
      label: 'In stock',
      bg: '#DCFCE7',
      color: '#166534',
    };
  };

  return (
    <View style={styles.screenRoot}>
      {/* Header with Safe Area spacing */}
      <View style={[styles.headerBlock, !isDesktop && { paddingTop: Math.max(insets.top, 16) + 4 }]}>
        <View style={styles.headerRow}>
          <Text style={styles.h1Title}>Items & stock</Text>
          <Pressable
            style={({ pressed }) => [
              styles.filledTealBtn,
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
            onPress={() => setAddModalOpen(true)}
            accessibilityRole="button"
          >
            <Feather name="plus" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.filledTealBtnText}>+ Add item</Text>
          </Pressable>
        </View>

        {/* Search & Filter Chips */}
        <View style={styles.controlsRow}>
          <View style={styles.searchBox}>
            <Feather name="search" size={18} color="#475569" style={{ marginRight: 10 }} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search item or HSN code"
              placeholderTextColor="#475569"
              style={styles.searchInput}
            />
          </View>

          <View style={styles.pillGroup}>
            <Pressable
              style={({ pressed }) => [
                styles.pillChip,
                filterChip === 'all' ? styles.pillChipActive : styles.pillChipOutlined,
                pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
              ]}
              onPress={() => setFilterChip('all')}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.pillChipText,
                  filterChip === 'all' ? styles.pillChipTextActive : styles.pillChipTextOutlined,
                ]}
              >
                All
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.pillChip,
                filterChip === 'low_stock' ? styles.pillChipActive : styles.pillChipOutlined,
                pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
              ]}
              onPress={() => setFilterChip('low_stock')}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.pillChipText,
                  filterChip === 'low_stock' ? styles.pillChipTextActive : styles.pillChipTextOutlined,
                ]}
              >
                Low stock
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Main Content Area */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isDesktop ? (
          /* Desktop Table View protected with horizontal scroll */
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Card style={[styles.tableCard, { minWidth: 720 }]}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, { flex: 2.4 }]}>ITEM</Text>
                <Text style={[styles.th, { flex: 1.2 }]}>HSN</Text>
                <Text style={[styles.th, { flex: 1.4 }]}>STOCK</Text>
                <Text style={[styles.th, { flex: 1.6, textAlign: 'right' }]}>SALE PRICE</Text>
                <Text style={[styles.th, { flex: 1.2, textAlign: 'center' }]}>GST</Text>
                <Text style={[styles.th, { flex: 1.4, textAlign: 'right' }]}>STATUS</Text>
              </View>

              {filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const badge = getStatusBadge(item);
                  return (
                    <Pressable
                      key={item.id}
                      style={styles.tableItemRow}
                      onPress={() => setSelectedItem(item)}
                    >
                      <Text style={[styles.tdBold, { flex: 2.4 }]}>{item.name}</Text>
                      <Text style={[styles.tdMuted, { flex: 1.2 }]}>{item.hsn || '-'}</Text>
                      <Text style={[styles.td, { flex: 1.4 }]}>
                        {item.stock_qty} {item.unit}
                      </Text>
                      <Text style={[styles.tdBold, { flex: 1.6, textAlign: 'right' }]}>
                        {formatMoney(item.sale_price)}
                      </Text>
                      <Text style={[styles.td, { flex: 1.2, textAlign: 'center' }]}>
                        {item.gst_rate}%
                      </Text>
                      <View style={{ flex: 1.4, alignItems: 'flex-end' }}>
                        <View style={[styles.badgePill, { backgroundColor: badge.bg }]}>
                          <Text style={[styles.badgeText, { color: badge.color }]}>
                            {badge.label}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })
              ) : (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>No items found</Text>
                </View>
              )}
            </Card>
          </ScrollView>
        ) : (
          /* Mobile Card View */
          <View style={styles.mobileCardList}>
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => {
                const badge = getStatusBadge(item);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setSelectedItem(item)}
                    style={({ pressed }) => [
                      pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
                    ]}
                  >
                    <Card style={styles.mobileItemCard}>
                      <View style={styles.mobileCardTop}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.mobileItemName}>{item.name}</Text>
                          <Text style={styles.mobileHsnText}>HSN: {item.hsn || '-'} · GST: {item.gst_rate}%</Text>
                        </View>
                        <View style={[styles.badgePill, { backgroundColor: badge.bg }]}>
                          <Text style={[styles.badgeText, { color: badge.color }]}>
                            {badge.label}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.mobileCardDivider} />

                      <View style={styles.mobileCardBottom}>
                        <Text style={styles.mobileStockText}>
                          Stock: <Text style={styles.mobileStockVal}>{item.stock_qty} {item.unit}</Text>
                        </Text>
                        <Text style={styles.mobilePriceText}>
                          {formatMoney(item.sale_price)}
                        </Text>
                      </View>
                    </Card>
                  </Pressable>
                );
              })
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No items found. Tap + Add item below.</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Stationary Floating Button: amber #F59E0B */}
      <Pressable
        style={({ pressed }) => [
          styles.floatingAddBtn,
          pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
        ]}
        onPress={() => setAddModalOpen(true)}
        accessibilityRole="button"
      >
        <Feather name="plus" size={20} color="#0F172A" style={{ marginRight: 6 }} />
        <Text style={styles.floatingAddText}>+ Add item</Text>
      </Pressable>

      {/* Item Details, Barcode & Stock Adjustment Modal */}
      <Modal
        visible={!!selectedItem}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedItem(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.itemDetailCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.itemModalTitle}>{selectedItem?.name}</Text>
                <Text style={styles.itemModalSub}>HSN: {selectedItem?.hsn} · Tax Rate: {selectedItem?.gst_rate}%</Text>
              </View>
              <Pressable
                onPress={() => setSelectedItem(null)}
                style={styles.modalCloseBtn}
                hitSlop={12}
              >
                <Feather name="x" size={22} color="#64748B" />
              </Pressable>
            </View>

            {/* Authentic Barcode Label Preview */}
            <View style={styles.barcodeBox}>
              <Text style={styles.barcodeItemName}>{selectedItem?.name}</Text>
              <View style={styles.barcodeLinesRow}>
                {/* Render simulated Code-128 barcode bars */}
                {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2].map((barW, idx) => (
                  <View
                    key={idx}
                    style={{
                      width: barW,
                      height: 42,
                      backgroundColor: idx % 2 === 0 ? '#0F172A' : '#FFFFFF',
                      marginRight: 1.5,
                    }}
                  />
                ))}
              </View>
              <Text style={styles.barcodeNumbers}>8 901234 {selectedItem?.hsn || '0000'} 7</Text>
              <Text style={styles.barcodeMrp}>MRP: {selectedItem ? formatMoney(selectedItem.sale_price) : ''} (incl. GST)</Text>
            </View>

            <View style={styles.priceRow}>
              <View style={styles.priceCol}>
                <Text style={styles.priceLabel}>Sale Price</Text>
                <Text style={styles.salePriceVal}>
                  {selectedItem ? formatMoney(selectedItem.sale_price) : ''}
                </Text>
              </View>
              <View style={styles.priceCol}>
                <Text style={styles.priceLabel}>Purchase Price</Text>
                <Text style={styles.purchasePriceVal}>
                  {selectedItem ? formatMoney(selectedItem.purchase_price) : ''}
                </Text>
              </View>
              <View style={styles.priceCol}>
                <Text style={styles.priceLabel}>Stock in Hand</Text>
                <Text style={styles.stockVal}>
                  {selectedItem?.stock_qty} {selectedItem?.unit}
                </Text>
              </View>
            </View>

            {/* Quick Stock Adjustment */}
            <View style={styles.adjustSection}>
              <Text style={styles.adjustTitle}>Adjust Stock</Text>
              <View style={styles.adjustControls}>
                <Pressable
                  style={[styles.adjustTypeBtn, adjustReason === 'add' && styles.adjustTypeBtnActive]}
                  onPress={() => setAdjustReason('add')}
                >
                  <Text style={[styles.adjustTypeText, adjustReason === 'add' && styles.adjustTypeTextActive]}>+ Add Stock</Text>
                </Pressable>
                <Pressable
                  style={[styles.adjustTypeBtn, adjustReason === 'deduct' && styles.adjustTypeBtnActive]}
                  onPress={() => setAdjustReason('deduct')}
                >
                  <Text style={[styles.adjustTypeText, adjustReason === 'deduct' && styles.adjustTypeTextActive]}>- Reduce Stock</Text>
                </Pressable>
              </View>
              <View style={styles.adjustInputRow}>
                <TextInput
                  value={adjustQty}
                  onChangeText={setAdjustQty}
                  placeholder="Qty to adjust"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  style={styles.adjustInput}
                />
                <Pressable style={styles.adjustSubmitBtn} onPress={handleAdjustStock}>
                  <Text style={styles.adjustSubmitText}>Update Stock</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Item Modal */}
      <Modal
        visible={addModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAddModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addModalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Add New Item</Text>
              <Pressable
                onPress={() => setAddModalOpen(false)}
                style={styles.modalCloseBtn}
                hitSlop={12}
              >
                <Feather name="x" size={20} color="#64748B" />
              </Pressable>
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>Item Name *</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Basmati Rice 5kg"
                placeholderTextColor="#94A3B8"
                style={styles.modalTextInput}
              />
            </View>

            <View style={styles.modalTwoColRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalLabel}>HSN Code</Text>
                <TextInput
                  value={hsn}
                  onChangeText={setHsn}
                  placeholder="e.g. 1006"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  style={styles.modalTextInput}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.modalLabel}>Unit</Text>
                <TextInput
                  value={unit}
                  onChangeText={setUnit}
                  placeholder="pcs / kg / bag"
                  placeholderTextColor="#94A3B8"
                  style={styles.modalTextInput}
                />
              </View>
            </View>

            <View style={styles.modalTwoColRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalLabel}>Sale Price (₹) *</Text>
                <TextInput
                  value={salePrice}
                  onChangeText={setSalePrice}
                  placeholder="0.00"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  style={styles.modalTextInput}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.modalLabel}>Purchase Price (₹)</Text>
                <TextInput
                  value={purchasePrice}
                  onChangeText={setPurchasePrice}
                  placeholder="0.00"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  style={styles.modalTextInput}
                />
              </View>
            </View>

            <View style={styles.modalTwoColRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalLabel}>GST Rate (%)</Text>
                <TextInput
                  value={gstRate}
                  onChangeText={setGstRate}
                  placeholder="5"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  style={styles.modalTextInput}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.modalLabel}>Opening Stock</Text>
                <TextInput
                  value={stockQty}
                  onChangeText={setStockQty}
                  placeholder="0"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  style={styles.modalTextInput}
                />
              </View>
            </View>

            <View style={styles.modalActionRow}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setAddModalOpen(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>

              <Pressable style={styles.modalSubmitBtn} onPress={handleAddItem}>
                <Text style={styles.modalSubmitText}>Save Item</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#F4F6FA',
  },
  headerBlock: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  h1Title: {
    fontSize: 22,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F172A',
  },
  filledTealBtn: {
    height: 44,
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#1D4ED8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filledTealBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  searchBox: {
    flex: 1,
    minWidth: 200,
    height: 44,
    backgroundColor: '#F4F6FA',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#0F172A',
    outlineStyle: 'none' as any,
  },
  pillGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  pillChip: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillChipActive: {
    backgroundColor: '#1D4ED8',
  },
  pillChipOutlined: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  pillChipText: {
    fontSize: 14,
  },
  pillChipTextActive: {
    color: '#FFFFFF',
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  pillChipTextOutlined: {
    color: '#0F172A',
    fontFamily: fonts.medium,
  },

  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 90,
  },

  // Desktop Table
  tableCard: {
    padding: 0,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  th: {
    fontSize: 12,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  tableItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tdBold: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#0F172A',
  },
  tdMuted: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#64748B',
  },
  td: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#0F172A',
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  emptyBox: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: fonts.regular,
  },

  // Mobile Cards
  mobileCardList: {
    gap: 10,
  },
  mobileItemCard: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  mobileCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  mobileItemName: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#0F172A',
  },
  mobileHsnText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#64748B',
    marginTop: 2,
  },
  mobileCardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  mobileCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mobileStockText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#64748B',
  },
  mobileStockVal: {
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#0F172A',
  },
  mobilePriceText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F172A',
  },

  // Stationary Floating Button
  floatingAddBtn: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    height: 52,
    minHeight: 52,
    paddingHorizontal: 22,
    borderRadius: 28,
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 999,
  },
  floatingAddText: {
    color: '#0F172A',
    fontSize: 15,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },

  // Item Action & Barcode Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  itemDetailCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemModalTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F172A',
  },
  itemModalSub: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#64748B',
    marginTop: 2,
  },
  barcodeBox: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginVertical: 14,
  },
  barcodeItemName: {
    fontSize: 13,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  barcodeLinesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  barcodeNumbers: {
    fontSize: 12,
    fontFamily: fonts.medium,
    letterSpacing: 2,
    color: '#0F172A',
    marginTop: 4,
  },
  barcodeMrp: {
    fontSize: 12,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#1D4ED8',
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  priceCol: {
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: fonts.regular,
    marginBottom: 2,
  },
  salePriceVal: {
    fontSize: 15,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  purchasePriceVal: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#64748B',
  },
  stockVal: {
    fontSize: 15,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F172A',
  },
  adjustSection: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 14,
  },
  adjustTitle: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
  },
  adjustControls: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  adjustTypeBtn: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  adjustTypeBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#1D4ED8',
  },
  adjustTypeText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: '#64748B',
  },
  adjustTypeTextActive: {
    color: '#1D4ED8',
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  adjustInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  adjustInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0F172A',
  },
  adjustSubmitBtn: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustSubmitText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },

  // Add Item Modal
  addModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    gap: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  modalInputGroup: {},
  modalLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#475569',
    marginBottom: 4,
  },
  modalTextInput: {
    height: 44,
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#0F172A',
    outlineStyle: 'none' as any,
  },
  modalTwoColRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  modalCancelBtn: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    color: '#64748B',
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  modalSubmitBtn: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
});
