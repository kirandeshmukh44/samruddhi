// app/src/screens/InvoicesScreen.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  useWindowDimensions,
  Modal,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import Card from '../components/Card';
import { colors, radii, fonts } from '../theme';
import { formatMoney, toPaise } from '../lib/money';
import { calcLineGst, sumGst, GstBreakup } from '../lib/gst';
import { mockParties, mockItems } from '../services/mockData';
import { useAuth } from '../context/AuthContext';
import { createInvoice } from '../services/invoices';
import { DocumentType, SupplyCategory } from '../types';

interface InvoiceItemState {
  id: string;
  itemId?: string;
  name: string;
  hsn?: string;
  qty: number;
  rateRupees: number;
  gstRate: number;
}

const PAYMENT_MODES = ['Cash', 'UPI', 'Card', 'Bank transfer'];

const DOC_TYPES: { key: DocumentType; label: string; desc: string }[] = [
  { key: 'tax_invoice', label: 'Tax Invoice', desc: 'Standard GST tax invoice' },
  { key: 'quotation', label: 'Quotation', desc: 'Commercial price quotation for buyer approval' },
  { key: 'proforma', label: 'Proforma / Estimate', desc: 'Proforma estimate before official supply' },
  { key: 'bill_of_supply', label: 'Bill of Supply (No GST)', desc: 'Official Bill of Supply for exempt or non-GST supplies' },
  { key: 'composition', label: 'Composition (Bill of Supply)', desc: 'Composition scheme bill of supply (no tax collection)' },
  { key: 'credit_note', label: 'Credit Note', desc: 'GST credit adjustment note against issued invoice' },
  { key: 'delivery_challan', label: 'Delivery Challan', desc: 'Delivery note for transit of goods without sale' },
];

const SUPPLY_CATEGORIES: { key: SupplyCategory; label: string; tip: string }[] = [
  { key: 'goods', label: 'Goods', tip: 'Use a 4, 6 or 8-digit HSN code for physical commodities' },
  { key: 'services', label: 'Services', tip: 'Use a SAC code (services accounting code) in the HSN/SAC column' },
  { key: 'mixed', label: 'Mixed', tip: 'Ensure both Goods HSN and Services SAC codes are specified per row' },
];

export default function InvoicesScreen({ type }: { type: 'sale' | 'purchase' }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const { currentBusiness } = useAuth();

  const businessState = currentBusiness?.state || 'Maharashtra';
  const businessName = currentBusiness?.name || 'Gupta Traders';

  // Form states
  const [docType, setDocType] = useState<DocumentType>('tax_invoice');
  const [supplyCategory, setSupplyCategory] = useState<SupplyCategory>('goods');
  const [billingAddress, setBillingAddress] = useState('');

  const [selectedPartyId, setSelectedPartyId] = useState<string>('p-1');
  const [partyPickerOpen, setPartyPickerOpen] = useState(false);
  const [partySearch, setPartySearch] = useState('');

  const [invoiceNo, setInvoiceNo] = useState(type === 'sale' ? 'INV-0004' : 'PB-0002');
  const [dateStr, setDateStr] = useState(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  });

  const [paymentMode, setPaymentMode] = useState('Cash');
  const [modePickerOpen, setModePickerOpen] = useState(false);
  const [discountRupees, setDiscountRupees] = useState(0);

  // Line items state
  const [items, setItems] = useState<InvoiceItemState[]>([
    {
      id: '1',
      itemId: 'i-1',
      name: 'Rice 25kg',
      qty: 1,
      rateRupees: 1200,
      gstRate: 5,
    },
    {
      id: '2',
      itemId: 'i-3',
      name: 'Sugar 1kg',
      qty: 2,
      rateRupees: 45,
      gstRate: 5,
    },
  ]);

  const [itemPickerIndex, setItemPickerIndex] = useState<number | null>(null);
  const [itemSearch, setItemSearch] = useState('');

  // Success / Preview modal
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [savedInv, setSavedInv] = useState<any | null>(null);

  // Parties list filtered by type
  const relevantParties = mockParties.filter((p) =>
    type === 'sale' ? p.type === 'customer' : p.type === 'supplier'
  );

  const filteredParties = relevantParties.filter((p) =>
    p.name.toLowerCase().includes(partySearch.toLowerCase()) ||
    (p.phone && p.phone.includes(partySearch))
  );

  const selectedParty = mockParties.find((p) => p.id === selectedPartyId);
  const partyState = selectedParty?.state || businessState;
  const isSameState = businessState.toLowerCase().trim() === partyState.toLowerCase().trim();

  // Line calculations & total breakup
  const lineCalculations = useMemo(() => {
    return items.map((item) => {
      const pricePaise = toPaise(item.rateRupees);
      const breakup = calcLineGst(item.qty, pricePaise, item.gstRate, isSameState);
      return breakup;
    });
  }, [items, isSameState]);

  const totalBreakup: GstBreakup = useMemo(() => {
    return sumGst(lineCalculations);
  }, [lineCalculations]);

  const discountPaise = toPaise(discountRupees);
  const grandTotalPaise = Math.max(0, totalBreakup.total - discountPaise);

  const [amountReceivedRupees, setAmountReceivedRupees] = useState<string>('0.00');

  // Line helpers
  const updateItemField = (index: number, field: keyof InvoiceItemState, value: any) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: 'Select item',
        qty: 1,
        rateRupees: 0,
        gstRate: 5,
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const selectPredefinedItem = (index: number, predefinedItem: typeof mockItems[0]) => {
    const rate = (type === 'sale' ? predefinedItem.sale_price : predefinedItem.purchase_price) / 100;
    setItems((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        itemId: predefinedItem.id,
        name: predefinedItem.name,
        hsn: predefinedItem.hsn || (supplyCategory === 'services' ? '998311' : '1006'),
        qty: 1,
        rateRupees: rate,
        gstRate: predefinedItem.gst_rate,
      };
      return next;
    });
    setItemPickerIndex(null);
  };

  const buildWhatsAppText = () => {
    const pName = selectedParty?.name || (type === 'sale' ? 'Customer' : 'Supplier');
    const totalRs = (grandTotalPaise / 100).toFixed(2);
    const paidRs = parseFloat(amountReceivedRupees) || 0;
    const balanceDue = Math.max(0, grandTotalPaise / 100 - paidRs).toFixed(2);

    let msg = `*TAX INVOICE: ${invoiceNo}*\n`;
    msg += `From: ${businessName}\n`;
    msg += `To: ${pName}\n`;
    msg += `Date: ${dateStr}\n\n`;
    msg += `*Items:*\n`;
    items.forEach((it, idx) => {
      if (it.name && it.name !== 'Select item') {
        msg += `${idx + 1}. ${it.name} (x${it.qty}) - ₹ ${(it.rateRupees * it.qty).toFixed(2)}\n`;
      }
    });
    msg += `\nTaxable: ₹ ${(totalBreakup.taxable / 100).toFixed(2)}\n`;
    msg += `GST: ₹ ${((totalBreakup.cgst + totalBreakup.sgst + totalBreakup.igst) / 100).toFixed(2)}\n`;
    msg += `*Total: ₹ ${totalRs}*\n`;
    msg += `Paid: ₹ ${paidRs.toFixed(2)}\n`;
    msg += `*Balance Due: ₹ ${balanceDue}*\n\n`;
    msg += `Thank you for your business!`;
    return msg;
  };

  const handleShareWhatsApp = () => {
    const text = buildWhatsAppText();
    const cleanPhone = selectedParty?.phone ? selectedParty.phone.replace(/\D/g, '') : '';
    const url = cleanPhone
      ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    Linking.openURL(url).catch(() => {});
  };

  const handleSaveInvoice = async (andPrint: boolean = false) => {
    const validItems = items.filter((i) => i.name && i.name !== 'Select item');
    if (!validItems.length) {
      alert('Please select at least one valid item');
      return;
    }
    const paidPaise = toPaise(parseFloat(amountReceivedRupees) || 0);
    const newInv = {
      business_id: currentBusiness?.id || 'b-1',
      party_id: selectedPartyId || undefined,
      party_name: selectedParty?.name || (type === 'sale' ? 'Sharma Retail' : 'Mehta Distributors'),
      party_gstin: selectedParty?.gstin,
      billing_address: billingAddress || selectedParty?.address || 'Pune, Maharashtra',
      invoice_no: invoiceNo,
      type,
      doc_type: docType,
      supply_category: supplyCategory,
      date: new Date().toISOString().split('T')[0],
      subtotal: totalBreakup.taxable,
      discount: discountPaise,
      cgst: totalBreakup.cgst,
      sgst: totalBreakup.sgst,
      igst: totalBreakup.igst,
      total: grandTotalPaise,
      paid_amount: paidPaise,
      status: paidPaise >= grandTotalPaise ? ('paid' as const) : paidPaise > 0 ? ('partial' as const) : ('unpaid' as const),
      items: validItems.map((v, i) => ({
        id: `ii-${Date.now()}-${i}`,
        invoice_id: invoiceNo,
        name: v.name,
        hsn: v.hsn || (supplyCategory === 'services' ? '998311' : '1006'),
        qty: v.qty,
        unit: supplyCategory === 'services' ? 'hours' : 'pcs',
        price: toPaise(v.rateRupees),
        gst_rate: v.gstRate,
        amount: toPaise(v.rateRupees * v.qty),
      })),
    };

    await createInvoice(newInv as any);
    setSavedInv(newInv);
    setSuccessModalOpen(true);
  };

  const titleText = type === 'sale' ? t('invoices.newSale', 'New sale invoice') : t('invoices.newPurchase', 'New purchase bill');
  const customerLabel = type === 'sale' ? t('parties.customer', 'Customer') : t('parties.supplier', 'Supplier');
  const customerPlaceholder = `[${customerLabel}]`;

  const docTypes = useMemo(() => [
    { key: 'tax_invoice' as DocumentType, label: t('invoices.taxInvoice', 'Tax Invoice'), desc: 'Standard GST tax invoice' },
    { key: 'quotation' as DocumentType, label: t('invoices.quotation', 'Quotation'), desc: 'Commercial price quotation for buyer approval' },
    { key: 'proforma' as DocumentType, label: t('invoices.proforma', 'Proforma / Estimate'), desc: 'Proforma estimate before official supply' },
    { key: 'bill_of_supply' as DocumentType, label: t('invoices.billOfSupply', 'Bill of Supply (No GST)'), desc: 'Official Bill of Supply for exempt or non-GST supplies' },
    { key: 'composition' as DocumentType, label: t('invoices.composition', 'Composition (Bill of Supply)'), desc: 'Composition scheme bill of supply (no tax collection)' },
    { key: 'credit_note' as DocumentType, label: t('invoices.creditNote', 'Credit Note'), desc: 'GST credit adjustment note against issued invoice' },
    { key: 'delivery_challan' as DocumentType, label: t('invoices.deliveryChallan', 'Delivery Challan'), desc: 'Delivery note for transit of goods without sale' },
  ], [t]);

  const supplyCategories = useMemo(() => [
    { key: 'goods' as SupplyCategory, label: t('invoices.goods', 'Goods'), tip: 'Use a 4, 6 or 8-digit HSN code for physical commodities' },
    { key: 'services' as SupplyCategory, label: t('invoices.services', 'Services'), tip: 'Use a SAC code (services accounting code) in the HSN/SAC column' },
    { key: 'mixed' as SupplyCategory, label: t('invoices.mixed', 'Mixed'), tip: 'Ensure both Goods HSN and Services SAC codes are specified per row' },
  ], [t]);

  return (
    <ScrollView style={styles.scrollRoot} contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      {/* Top Action Control Bar (Matching Image 4) */}
      <View style={styles.topControlBar}>
        <View style={styles.topBarLeftGroup}>
          <Pressable style={styles.backButton} onPress={() => router.back()} accessibilityRole="button">
            <Feather name="arrow-left" size={18} color="#0F172A" />
            <Text style={styles.backButtonText}>{t('common.back', 'Back')}</Text>
          </Pressable>

          <View style={styles.draftBadge}>
            <View style={styles.draftDot} />
            <Text style={styles.draftBadgeText}>{t('invoices.draft', 'Draft — click to complete')}</Text>
          </View>
        </View>

        <View style={styles.topBarRightActions}>
          <Pressable
            style={({ pressed }) => [styles.filledSaveBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
            onPress={() => handleSaveInvoice(false)}
            accessibilityRole="button"
          >
            <Feather name="check" size={15} color="#FFFFFF" style={{ marginRight: 5 }} />
            <Text style={styles.filledSaveBtnText}>{t('invoices.saveInvoice', 'Save')}</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.outlinedActionBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
            onPress={() => handleSaveInvoice(true)}
            accessibilityRole="button"
          >
            <Feather name="download" size={15} color="#1D4ED8" style={{ marginRight: 5 }} />
            <Text style={styles.outlinedActionBtnText}>{t('invoices.saveAndDownload', 'Save & Download')}</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.outlinedActionBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
            onPress={() => handleSaveInvoice(true)}
            accessibilityRole="button"
          >
            <Feather name="printer" size={15} color="#475569" style={{ marginRight: 5 }} />
            <Text style={[styles.outlinedActionBtnText, { color: '#475569' }]}>{t('invoices.print', 'Print')}</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.whatsAppActionBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
            onPress={handleShareWhatsApp}
            accessibilityRole="button"
          >
            <Feather name="message-circle" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.whatsAppActionBtnText}>{t('invoices.whatsApp', 'WhatsApp')}</Text>
          </Pressable>
        </View>
      </View>

      {/* Main Container */}
      <View style={[styles.mainLayout, isDesktop && styles.mainLayoutDesktop]}>
        {/* Left White Card: Form & Items Table */}
        <Card style={styles.leftFormCard}>
          {/* Invoice Type Pills Selector (Matching Image 4) */}
          <View style={styles.docTypeSection}>
            <Text style={styles.docTypeSectionLabel}>{t('invoices.invoiceType', 'Invoice Type')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.docTypeScroll}>
              <View style={styles.docTypePillsRow}>
                {docTypes.map((dt) => {
                  const isSelected = docType === dt.key;
                  return (
                    <Pressable
                      key={dt.key}
                      style={[styles.docTypePill, isSelected && styles.docTypePillSelected]}
                      onPress={() => setDocType(dt.key)}
                    >
                      <Text style={[styles.docTypePillText, isSelected && styles.docTypePillTextSelected]}>
                        {dt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
            <Text style={styles.docTypeDescText}>
              {docTypes.find((d) => d.key === docType)?.desc}
            </Text>
          </View>

          {/* This invoice is for: Segment (Goods vs Services vs Mixed) */}
          <View style={styles.categorySection}>
            <View style={styles.categoryHeaderRow}>
              <Text style={styles.categoryLabel}>{t('invoices.invoiceFor', 'This invoice is for:')}</Text>
              <View style={styles.categoryPillsRow}>
                {supplyCategories.map((cat) => {
                  const isSel = supplyCategory === cat.key;
                  return (
                    <Pressable
                      key={cat.key}
                      style={[styles.categoryPill, isSel && styles.categoryPillSelected]}
                      onPress={() => setSupplyCategory(cat.key)}
                    >
                      <Text style={[styles.categoryPillText, isSel && styles.categoryPillTextSelected]}>
                        {cat.key === 'goods' ? '📦 ' : cat.key === 'services' ? '⏱️ ' : '🔀 '}
                        {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.categoryTipBox}>
              <Feather name="info" size={13} color="#1D4ED8" style={{ marginRight: 6 }} />
              <Text style={styles.categoryTipText}>
                {supplyCategories.find((c) => c.key === supplyCategory)?.tip}
              </Text>
            </View>
          </View>

          {/* Billed To Section (Matching Image 4) */}
          <View style={styles.billedToCard}>
            <Text style={styles.billedToTitle}>{t('invoices.billedTo', 'Billed To')}</Text>
            <View style={[styles.formTopRow, isDesktop && styles.formTopRowDesktop]}>
              <View style={[styles.fieldCol, { flex: isDesktop ? 2 : undefined }]}>
                <Text style={styles.fieldLabel}>{t('invoices.clientName', 'CLIENT NAME')}</Text>
                <Pressable
                  style={styles.selectField}
                  onPress={() => setPartyPickerOpen(true)}
                  accessibilityRole="combobox"
                >
                  <Text
                    style={[
                      styles.selectFieldText,
                      !selectedParty && styles.placeholderText,
                    ]}
                    numberOfLines={1}
                  >
                    {selectedParty ? selectedParty.name : 'Type client name to search or add new'}
                  </Text>
                  <Feather name="chevron-down" size={16} color="#0F172A" />
                </Pressable>
              </View>

              <View style={[styles.fieldCol, { flex: isDesktop ? 2 : undefined }]}>
                <Text style={styles.fieldLabel}>BILLING ADDRESS</Text>
                <View style={styles.inputField}>
                  <TextInput
                    value={billingAddress || selectedParty?.address || ''}
                    onChangeText={setBillingAddress}
                    placeholder="Enter client billing address"
                    placeholderTextColor="#94A3B8"
                    style={styles.textInput}
                  />
                </View>
              </View>
            </View>

            {/* Invoice No & Date Row */}
            <View style={[styles.formTopRow, isDesktop && styles.formTopRowDesktop, { marginTop: 4 }]}>
              <View style={[styles.fieldCol, { flex: isDesktop ? 1 : undefined }]}>
                <Text style={styles.fieldLabel}>INVOICE NO.</Text>
                <View style={styles.inputField}>
                  <TextInput
                    value={invoiceNo}
                    onChangeText={setInvoiceNo}
                    style={styles.textInput}
                  />
                </View>
              </View>

              <View style={[styles.fieldCol, { flex: isDesktop ? 1 : undefined }]}>
                <Text style={styles.fieldLabel}>DATE</Text>
                <View style={styles.inputField}>
                  <TextInput
                    value={dateStr}
                    onChangeText={setDateStr}
                    placeholder="mm/dd/yyyy"
                    placeholderTextColor="#94A3B8"
                    style={styles.textInput}
                  />
                  <Feather name="calendar" size={16} color="#0F172A" style={{ marginLeft: 6 }} />
                </View>
              </View>
            </View>
          </View>

          {/* Responsive Items Section: Mobile Cards vs Desktop Table */}
          {!isDesktop ? (
            /* Mobile View: Dedicated Item Cards with plenty of room for Qty, Rate, GST and Amount */
            <View style={styles.mobileItemsList}>
              <View style={styles.mobileItemsHeader}>
                <Text style={styles.mobileItemsHeaderTitle}>Items & Charges ({items.length})</Text>
              </View>

              {items.map((item, index) => {
                const lineCalc = lineCalculations[index];
                return (
                  <View key={item.id} style={styles.mobileItemCard}>
                    {/* Top Row: Full width Item Picker + Trash icon */}
                    <View style={styles.mobileItemCardTop}>
                      <Pressable
                        style={styles.mobileItemPickerBtn}
                        onPress={() => setItemPickerIndex(index)}
                      >
                        <Text
                          style={[
                            styles.mobileItemPickerText,
                            item.name === 'Select item' && styles.placeholderText,
                          ]}
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                        <Feather name="chevron-down" size={16} color="#1D4ED8" />
                      </Pressable>

                      <Pressable
                        style={styles.mobileTrashBtn}
                        onPress={() => removeItemRow(index)}
                      >
                        <Feather name="trash-2" size={18} color="#EF4444" />
                      </Pressable>
                    </View>

                    {/* Item Row Controls on Mobile: 2 clean spacious rows */}
                    <View style={styles.mobileItemInputsGrid}>
                      <View style={styles.mobileInputColHalf}>
                        <Text style={styles.mobileColLabel}>QUANTITY</Text>
                        <TextInput
                          value={String(item.qty || '')}
                          onChangeText={(val) =>
                            updateItemField(index, 'qty', parseInt(val, 10) || 0)
                          }
                          keyboardType="numeric"
                          placeholder="1"
                          placeholderTextColor="#94A3B8"
                          style={styles.mobileTextInput}
                        />
                      </View>

                      <View style={styles.mobileInputColHalf}>
                        <Text style={styles.mobileColLabel}>RATE / PRICE (₹)</Text>
                        <TextInput
                          value={String(item.rateRupees || '')}
                          onChangeText={(val) =>
                            updateItemField(index, 'rateRupees', parseFloat(val) || 0)
                          }
                          keyboardType="numeric"
                          placeholder="0.00"
                          placeholderTextColor="#94A3B8"
                          style={[styles.mobileTextInput, { textAlign: 'right' }]}
                        />
                      </View>
                    </View>

                    <View style={[styles.mobileItemInputsGrid, { marginTop: 10 }]}>
                      <View style={styles.mobileInputColHalf}>
                        <Text style={styles.mobileColLabel}>GST TAX RATE (%)</Text>
                        <TextInput
                          value={String(item.gstRate ?? '')}
                          onChangeText={(val) =>
                            updateItemField(index, 'gstRate', parseFloat(val) || 0)
                          }
                          keyboardType="numeric"
                          placeholder="5"
                          placeholderTextColor="#94A3B8"
                          style={styles.mobileTextInput}
                        />
                      </View>

                      <View style={[styles.mobileInputColHalf, { alignItems: 'flex-end', justifyContent: 'center' }]}>
                        <Text style={styles.mobileColLabel}>ITEM TOTAL</Text>
                        <Text style={styles.mobileItemLineAmount}>
                          {lineCalc ? formatMoney(lineCalc.total) : '₹ 0.00'}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            /* Desktop Table View with Horizontal Scroll Protection */
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={[styles.tableBox, { minWidth: 720 }]}>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.tableTh, { flex: 2.6 }]}>ITEM</Text>
                  <Text style={[styles.tableTh, { flex: 1.0, textAlign: 'center' }]}>QTY</Text>
                  <Text style={[styles.tableTh, { flex: 1.4, textAlign: 'right' }]}>RATE (₹)</Text>
                  <Text style={[styles.tableTh, { flex: 1.0, textAlign: 'center' }]}>GST %</Text>
                  <Text style={[styles.tableTh, { flex: 1.4, textAlign: 'right' }]}>AMOUNT (₹)</Text>
                  <Text style={[styles.tableTh, { width: 36, textAlign: 'center' }]}></Text>
                </View>

                {items.map((item, index) => {
                  const lineCalc = lineCalculations[index];
                  return (
                    <View key={item.id} style={styles.tableRow}>
                      <Pressable
                        style={[styles.itemPickField, { flex: 2.6 }]}
                        onPress={() => setItemPickerIndex(index)}
                      >
                        <Text
                          style={[
                            styles.itemPickText,
                            item.name === 'Select item' && styles.placeholderText,
                          ]}
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                        <Feather name="chevron-down" size={14} color="#64748B" />
                      </Pressable>

                      <View style={[styles.rowInputBox, { flex: 1.0 }]}>
                        <TextInput
                          value={String(item.qty || '')}
                          onChangeText={(val) =>
                            updateItemField(index, 'qty', parseInt(val, 10) || 0)
                          }
                          keyboardType="numeric"
                          style={[styles.tableInput, { textAlign: 'center' }]}
                        />
                      </View>

                      <View style={[styles.rowInputBox, { flex: 1.4 }]}>
                        <TextInput
                          value={String(item.rateRupees || '')}
                          onChangeText={(val) =>
                            updateItemField(index, 'rateRupees', parseFloat(val) || 0)
                          }
                          keyboardType="numeric"
                          style={[styles.tableInput, { textAlign: 'right' }]}
                        />
                      </View>

                      <View style={[styles.rowInputBox, { flex: 1.0 }]}>
                        <TextInput
                          value={String(item.gstRate ?? '')}
                          onChangeText={(val) =>
                            updateItemField(index, 'gstRate', parseFloat(val) || 0)
                          }
                          keyboardType="numeric"
                          style={[styles.tableInput, { textAlign: 'center' }]}
                        />
                      </View>

                      <View style={{ flex: 1.4, alignItems: 'flex-end', justifyContent: 'center' }}>
                        <Text style={styles.lineAmountText}>
                          {lineCalc ? formatMoney(lineCalc.total) : '₹ 0.00'}
                        </Text>
                      </View>

                      <Pressable
                        style={{ width: 36, alignItems: 'center', justifyContent: 'center' }}
                        onPress={() => removeItemRow(index)}
                      >
                        <Feather name="trash-2" size={16} color="#94A3B8" />
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          )}

          {/* Add item row button */}
          <Pressable
            style={styles.addItemRowBtn}
            onPress={addItemRow}
            accessibilityRole="button"
          >
            <Feather name="plus" size={16} color="#1D4ED8" style={{ marginRight: 6 }} />
            <Text style={styles.addItemRowBtnText}>{t('invoices.addItem', '+ Add item row')}</Text>
          </Pressable>
        </Card>

        {/* Right White Card: Summary */}
        <Card style={styles.rightSummaryCard}>
          <Text style={styles.summaryTitle}>{t('invoices.billSummary', 'Bill Summary')}</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('common.subtotal', 'Subtotal')} ({t('invoices.taxable', 'Taxable')})</Text>
            <Text style={styles.summaryValue}>
              {formatMoney(totalBreakup.taxable)}
            </Text>
          </View>

          {isSameState ? (
            <>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('common.cgst', 'CGST')}</Text>
                <Text style={styles.summaryValue}>{formatMoney(totalBreakup.cgst)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('common.sgst', 'SGST')}</Text>
                <Text style={styles.summaryValue}>{formatMoney(totalBreakup.sgst)}</Text>
              </View>
            </>
          ) : (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('common.igst', 'IGST')} (Inter-state)</Text>
              <Text style={styles.summaryValue}>{formatMoney(totalBreakup.igst)}</Text>
            </View>
          )}

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('common.discount', 'Discount')} (₹)</Text>
            <View style={styles.discountInputWrap}>
              <TextInput
                value={String(discountRupees || '')}
                onChangeText={(val) => setDiscountRupees(parseFloat(val) || 0)}
                placeholder="0"
                keyboardType="numeric"
                style={styles.discountInput}
              />
            </View>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>{t('common.grandTotal', 'Grand Total')}</Text>
            <Text style={styles.grandTotalValue}>{formatMoney(grandTotalPaise)}</Text>
          </View>

          <View style={styles.summaryInputGroup}>
            <Text style={styles.fieldLabel}>{t('invoices.paymentMode', 'Payment Mode')}</Text>
            <Pressable
              style={styles.selectField}
              onPress={() => setModePickerOpen(true)}
            >
              <Text style={styles.selectFieldText}>{paymentMode}</Text>
              <Feather name="chevron-down" size={16} color="#0F172A" />
            </Pressable>
          </View>

          <View style={styles.summaryInputGroup}>
            <Text style={styles.fieldLabel}>{t('invoices.amountReceived', 'Amount Received (₹)')}</Text>
            <View style={styles.inputField}>
              <TextInput
                value={amountReceivedRupees}
                onChangeText={setAmountReceivedRupees}
                placeholder="0.00"
                keyboardType="numeric"
                style={styles.textInput}
              />
            </View>
          </View>

          <Pressable
            style={[styles.filledActionBtn, { marginTop: 20 }]}
            onPress={() => handleSaveInvoice(false)}
          >
            <Text style={styles.filledActionBtnText}>
              {type === 'sale' ? t('invoices.saveInvoice', 'Save & Complete Invoice') : t('invoices.saveInvoice', 'Save & Complete Bill')}
            </Text>
          </Pressable>
        </Card>
      </View>

      {/* Invoice Saved Success / Print Preview Modal */}
      <Modal
        visible={successModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSuccessModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.invoiceModalCard}>
            <Pressable
              style={styles.invoiceModalCloseBtn}
              onPress={() => setSuccessModalOpen(false)}
              hitSlop={12}
            >
              <Feather name="x" size={20} color="#64748B" />
            </Pressable>

            <View style={styles.successIconBadge}>
              <Feather name="check-circle" size={36} color="#047857" />
            </View>
            <Text style={styles.invoiceModalTitle}>Invoice Saved Successfully!</Text>
            <Text style={styles.invoiceModalSub}>
              {savedInv?.invoice_no} · {savedInv?.party_name}
            </Text>
            <Text style={styles.invoiceTotalHighlight}>
              {savedInv ? formatMoney(savedInv.total) : ''}
            </Text>

            <View style={styles.modalActionButtons}>
              <Pressable
                style={styles.modalWhatsAppBtn}
                onPress={handleShareWhatsApp}
              >
                <Feather name="share-2" size={16} color="#047857" style={{ marginRight: 6 }} />
                <Text style={styles.modalWhatsAppText}>Share on WhatsApp</Text>
              </Pressable>

              <Pressable
                style={styles.modalDoneBtn}
                onPress={() => {
                  setSuccessModalOpen(false);
                  router.push('/');
                }}
              >
                <Text style={styles.modalDoneText}>Done / Back to Dashboard</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Party Picker Modal */}
      <Modal
        visible={partyPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPartyPickerOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalCardHeader}>
              <Text style={styles.modalTitle}>Select {customerLabel}</Text>
              <Pressable
                style={styles.modalTopCloseBtn}
                onPress={() => setPartyPickerOpen(false)}
                hitSlop={12}
              >
                <Feather name="x" size={20} color="#64748B" />
              </Pressable>
            </View>

            <View style={styles.modalSearchBox}>
              <Feather name="search" size={16} color="#64748B" style={{ marginRight: 8 }} />
              <TextInput
                value={partySearch}
                onChangeText={setPartySearch}
                placeholder="Search party name or phone"
                placeholderTextColor="#94A3B8"
                style={styles.modalSearchInput}
              />
            </View>

            <ScrollView style={{ maxHeight: 260 }}>
              {filteredParties.map((party) => (
                <Pressable
                  key={party.id}
                  style={[
                    styles.modalOption,
                    selectedPartyId === party.id && styles.modalOptionActive,
                  ]}
                  onPress={() => {
                    setSelectedPartyId(party.id);
                    setPartyPickerOpen(false);
                  }}
                >
                  <View>
                    <Text
                      style={[
                        styles.modalOptionText,
                        selectedPartyId === party.id && styles.modalOptionTextActive,
                      ]}
                    >
                      {party.name}
                    </Text>
                    <Text style={styles.modalOptionSub}>
                      {party.phone || 'No phone'} · {party.state || 'Maharashtra'}
                    </Text>
                  </View>
                  {selectedPartyId === party.id && (
                    <Feather name="check" size={18} color="#1D4ED8" />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Item Picker Modal */}
      <Modal
        visible={itemPickerIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setItemPickerIndex(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalCardHeader}>
              <Text style={styles.modalTitle}>Choose Item from Inventory</Text>
              <Pressable
                style={styles.modalTopCloseBtn}
                onPress={() => setItemPickerIndex(null)}
                hitSlop={12}
              >
                <Feather name="x" size={20} color="#64748B" />
              </Pressable>
            </View>

            <View style={styles.modalSearchBox}>
              <Feather name="search" size={16} color="#64748B" style={{ marginRight: 8 }} />
              <TextInput
                value={itemSearch}
                onChangeText={setItemSearch}
                placeholder="Search item name or HSN"
                placeholderTextColor="#94A3B8"
                style={styles.modalSearchInput}
              />
            </View>

            <ScrollView style={{ maxHeight: 280 }}>
              {mockItems
                .filter((it) => it.name.toLowerCase().includes(itemSearch.toLowerCase()))
                .map((it) => {
                  const price = (type === 'sale' ? it.sale_price : it.purchase_price) / 100;
                  return (
                    <Pressable
                      key={it.id}
                      style={styles.modalOption}
                      onPress={() => {
                        if (itemPickerIndex !== null) {
                          selectPredefinedItem(itemPickerIndex, it);
                        }
                      }}
                    >
                      <View>
                        <Text style={styles.modalOptionText}>{it.name}</Text>
                        <Text style={styles.modalOptionSub}>
                          Stock: {it.stock_qty} {it.unit} · GST: {it.gst_rate}%
                        </Text>
                      </View>
                      <Text style={styles.itemSelectPrice}>₹ {price.toFixed(2)}</Text>
                    </Pressable>
                  );
                })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Payment Mode Modal */}
      <Modal
        visible={modePickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setModePickerOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalCardHeader}>
              <Text style={styles.modalTitle}>Payment Mode</Text>
              <Pressable
                style={styles.modalTopCloseBtn}
                onPress={() => setModePickerOpen(false)}
                hitSlop={12}
              >
                <Feather name="x" size={20} color="#64748B" />
              </Pressable>
            </View>

            {PAYMENT_MODES.map((mode) => (
              <Pressable
                key={mode}
                style={[
                  styles.modalOption,
                  paymentMode === mode && styles.modalOptionActive,
                ]}
                onPress={() => {
                  setPaymentMode(mode);
                  setModePickerOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    paymentMode === mode && styles.modalOptionTextActive,
                  ]}
                >
                  {mode}
                </Text>
                {paymentMode === mode && (
                  <Feather name="check" size={18} color="#1D4ED8" />
                )}
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollRoot: {
    flex: 1,
    backgroundColor: '#F4F6FA',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 90,
  },

  // Top Action Control Bar (Matching Image 4)
  topControlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  topBarLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  backButtonText: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#0F172A',
  },
  draftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  draftDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D97706',
    marginRight: 6,
  },
  draftBadgeText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#B45309',
  },
  topBarRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  filledSaveBtn: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filledSaveBtnText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  whatsAppActionBtn: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsAppActionBtnText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Document Type Selector (Matching Image 4)
  docTypeSection: {
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  docTypeSectionLabel: {
    fontSize: 11,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  docTypeScroll: {
    marginBottom: 6,
  },
  docTypePillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  docTypePill: {
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docTypePillSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  docTypePillText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: '#475569',
  },
  docTypePillTextSelected: {
    color: '#FFFFFF',
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  docTypeDescText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#64748B',
    marginTop: 2,
  },

  // Category Selector (Goods vs Services vs Mixed)
  categorySection: {
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: '#334155',
  },
  categoryPillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  categoryPill: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryPillSelected: {
    backgroundColor: '#1D4ED8',
  },
  categoryPillText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#475569',
  },
  categoryPillTextSelected: {
    color: '#FFFFFF',
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  categoryTipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
  },
  categoryTipText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#1D4ED8',
  },

  // Billed To Section
  billedToCard: {
    marginBottom: 16,
  },
  billedToTitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },

  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12,
  },
  h1Title: {
    fontSize: 24,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F172A',
  },
  actionButtonsGroup: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  outlinedActionBtn: {
    height: 42,
    minHeight: 42,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1D4ED8',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlinedActionBtnText: {
    color: '#1D4ED8',
    fontSize: 13,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
  },
  filledActionBtn: {
    height: 42,
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filledActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },

  mainLayout: {
    gap: 20,
  },
  mainLayoutDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  leftFormCard: {
    flex: 1,
    padding: 20,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  rightSummaryCard: {
    width: '100%',
    maxWidth: 360,
    padding: 20,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
  },

  formTopRow: {
    gap: 12,
    marginBottom: 20,
  },
  formTopRowDesktop: {
    flexDirection: 'row',
  },
  fieldCol: {},
  fieldLabel: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  selectField: {
    height: 44,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  selectFieldText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#0F172A',
  },
  placeholderText: {
    color: '#94A3B8',
  },
  inputField: {
    height: 44,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#0F172A',
    outlineStyle: 'none' as any,
  },

  tableBox: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 16,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tableTh: {
    fontSize: 11,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 6,
  },
  itemPickField: {
    height: 38,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
  },
  itemPickText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: '#0F172A',
  },
  rowInputBox: {
    height: 38,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    justifyContent: 'center',
  },
  tableInput: {
    height: '100%',
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#0F172A',
    paddingHorizontal: 6,
    outlineStyle: 'none' as any,
  },
  lineAmountText: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#0F172A',
  },

  // Mobile Items Card Styles (Prevents Column Squeeze)
  mobileItemsList: {
    gap: 12,
    marginBottom: 16,
  },
  mobileItemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  mobileItemsHeaderTitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F172A',
  },
  mobileItemCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  mobileItemCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mobileItemPickerBtn: {
    flex: 1,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mobileItemPickerText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#0F172A',
  },
  mobileTrashBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileItemInputsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mobileInputCol: {
    flex: 1,
  },
  mobileInputColHalf: {
    flex: 1,
  },
  mobileColLabel: {
    fontSize: 10,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  mobileTextInput: {
    height: 40,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 8,
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: '#0F172A',
    textAlign: 'center',
  },
  mobileItemLineAmount: {
    fontSize: 14,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#1D4ED8',
    marginTop: 6,
  },

  addItemRowBtn: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1D4ED8',
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addItemRowBtnText: {
    color: '#1D4ED8',
    fontSize: 14,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
  },

  summaryTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: '#0F172A',
  },
  discountInputWrap: {
    width: 80,
    height: 34,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
  },
  discountInput: {
    height: '100%',
    textAlign: 'right',
    paddingHorizontal: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F172A',
  },
  grandTotalValue: {
    fontSize: 18,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  summaryInputGroup: {
    marginTop: 12,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
    position: 'relative',
  },
  modalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTopCloseBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  modalSearchBox: {
    height: 42,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalSearchInput: {
    flex: 1,
    height: '100%',
    fontSize: 13,
    color: '#0F172A',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalOptionActive: {
    backgroundColor: '#EFF6FF',
  },
  modalOptionText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: '#0F172A',
  },
  modalOptionTextActive: {
    color: '#1D4ED8',
  },
  modalOptionSub: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#64748B',
    marginTop: 2,
  },
  itemSelectPrice: {
    fontSize: 14,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#1D4ED8',
  },

  // Invoice Saved Modal
  invoiceModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
  },
  invoiceModalCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    zIndex: 10,
  },
  successIconBadge: {
    marginBottom: 12,
  },
  invoiceModalTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  invoiceModalSub: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  invoiceTotalHighlight: {
    fontSize: 26,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: '#1D4ED8',
    marginVertical: 14,
  },
  modalActionButtons: {
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  modalWhatsAppBtn: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#047857',
    backgroundColor: '#F0FDF4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalWhatsAppText: {
    color: '#047857',
    fontSize: 14,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
  },
  modalDoneBtn: {
    height: 44,
    borderRadius: 10,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDoneText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
});
