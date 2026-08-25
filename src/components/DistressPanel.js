import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, TextInput,
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { COLORS, FONTS } from '../theme';
import { claimAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  distressLabel, distressColor, discountPct, formatMoney, formatDate, daysUntil,
} from '../utils/distress';

/**
 * Foreclosure/auction facts plus the claim entry point, mirroring the website's
 * DistressPanel. Every imported listing is claimable — the foreclosure header
 * and case facts only appear when there is distress data to show.
 */
export default function DistressPanel({ property, onClaimed, navigation }) {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [submitting, setSubmitting] = useState(false);

  const d = property.distress || {};
  const claim = property.claim || {};
  const discount = discountPct(property);
  const auctionIn = daysUntil(d.auction_date);
  const isDistressed = !!d.is_distressed;

  const facts = [
    d.estimated_value  && { icon: 'trending-down-outline', label: 'Est. market value', value: formatMoney(d.estimated_value) },
    d.estimated_equity && { icon: 'trending-up-outline',   label: 'Est. equity',       value: formatMoney(d.estimated_equity) },
    d.opening_bid      && { icon: 'hammer-outline',        label: 'Opening bid',       value: formatMoney(d.opening_bid) },
    d.auction_date     && { icon: 'calendar-outline',      label: 'Auction date',      value: formatDate(d.auction_date) },
    d.unpaid_balance   && { icon: 'business-outline',      label: 'Unpaid balance',    value: formatMoney(d.unpaid_balance) },
    d.default_amount   && { icon: 'business-outline',      label: 'Amount in default', value: formatMoney(d.default_amount) },
    d.lender           && { icon: 'business-outline',      label: 'Lender',            value: d.lender },
    d.case_number      && { icon: 'document-text-outline', label: 'Case number',       value: d.case_number },
    d.filed_date       && { icon: 'calendar-outline',      label: 'Filed',             value: formatDate(d.filed_date) },
  ].filter(Boolean);

  const openClaim = () => {
    if (!user) {
      navigation?.navigate('Auth', { screen: 'Login' });
      return;
    }
    setModalOpen(true);
  };

  const submitClaim = async () => {
    setSubmitting(true);
    try {
      const res = await claimAPI.submit(property.id, {
        message: message.trim() || null,
        contact_phone: phone.trim() || null,
      });
      Toast.show({ type: 'success', text1: res.data.message || 'Claim submitted' });
      setModalOpen(false);
      setMessage('');
      onClaimed?.();
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: err.response?.data?.detail || 'Could not submit your claim',
      });
    } finally { setSubmitting(false); }
  };

  // ── Claim call-to-action, which state depends on the claim status ──
  const renderClaimRow = () => {
    if (property.is_owner) {
      return (
        <View style={s.stateRow}>
          <Ionicons name="shield-checkmark" size={18} color={COLORS.success} />
          <Text style={s.stateText}>You own this listing. Edits go to admin review.</Text>
        </View>
      );
    }
    if (claim.status === 'claimed') {
      return (
        <View style={s.stateRow}>
          <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
          <Text style={s.stateText}>This property has been claimed.</Text>
        </View>
      );
    }
    if (claim.status === 'pending') {
      return (
        <View style={s.stateRow}>
          <Ionicons name="time-outline" size={18} color={COLORS.warning} />
          <Text style={s.stateText}>A claim is awaiting admin review.</Text>
        </View>
      );
    }
    if (!property.is_claimable) return null;

    return (
      <View style={s.claimRow}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={s.claimTitle}>Is this your property?</Text>
          <Text style={s.claimSub}>Claim it to manage the listing, photos and price yourself.</Text>
        </View>
        <TouchableOpacity style={s.claimBtn} onPress={openClaim} activeOpacity={0.85}>
          <Text style={s.claimBtnText}>Claim</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (!isDistressed && !property.is_claimable && !claim.status && !property.is_owner) {
    return null;
  }

  return (
    <View style={s.wrap}>
      {/* Distress headline */}
      {isDistressed && (
        <View style={[s.header, { backgroundColor: distressColor(d.type) }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Ionicons name="hammer" size={18} color="#FFF" />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={s.headerTitle}>{distressLabel(d.type)}</Text>
              {auctionIn != null && auctionIn >= 0 && (
                <Text style={s.headerSub}>
                  Auction in {auctionIn} day{auctionIn === 1 ? '' : 's'}
                </Text>
              )}
            </View>
          </View>
          {discount > 0 && (
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.discount}>{discount}%</Text>
              <Text style={s.discountSub}>below est. value</Text>
            </View>
          )}
        </View>
      )}

      {/* Case facts */}
      {isDistressed && facts.length > 0 && (
        <View style={s.facts}>
          {facts.map((f, i) => (
            <View key={i} style={s.fact}>
              <Ionicons name={f.icon} size={14} color={COLORS.textMuted} />
              <View style={{ marginLeft: 8, flex: 1 }}>
                <Text style={s.factLabel}>{f.label}</Text>
                <Text style={s.factValue} numberOfLines={1}>{f.value}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {renderClaimRow()}

      {/* Claim form */}
      <Modal visible={modalOpen} transparent animationType="slide"
             onRequestClose={() => setModalOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={s.modalWrap}>
          <View style={s.modalCard}>
            <View style={s.modalHead}>
              <Text style={s.modalTitle}>Claim this property</Text>
              <TouchableOpacity onPress={() => setModalOpen(false)} style={s.modalClose}>
                <Ionicons name="close" size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              <View style={s.noticeRow}>
                <Ionicons name="information-circle-outline" size={16} color={COLORS.textSecondary} />
                <Text style={s.noticeText}>
                  An admin reviews every claim. Once approved, the listing moves into
                  your account and your edits go through the approval queue.
                </Text>
              </View>

              <Text style={s.fieldLabel}>Contact phone</Text>
              <TextInput
                style={s.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+1 555 000 0000"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="phone-pad"
              />

              <Text style={s.fieldLabel}>Why is this yours? (optional)</Text>
              <TextInput
                style={[s.input, s.textarea]}
                value={message}
                onChangeText={setMessage}
                placeholder="Deed, tax record, agency agreement…"
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[s.submitBtn, submitting && { opacity: 0.6 }]}
                onPress={submitClaim}
                disabled={submitting}
                activeOpacity={0.85}>
                {submitting
                  ? <ActivityIndicator color="#FFF" size="small" />
                  : <Text style={s.submitText}>Submit claim</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    marginHorizontal: 20, marginTop: 18, borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card,
  },
  header: {
    paddingHorizontal: 16, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { ...FONTS.h4, color: '#FFF', fontSize: 15 },
  headerSub: { fontFamily: 'Raleway_500Medium', fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 1 },
  discount: { fontFamily: 'Raleway_800ExtraBold', fontSize: 22, color: '#FFF' },
  discountSub: { fontFamily: 'Raleway_700Bold', fontSize: 9, color: 'rgba(255,255,255,0.9)', letterSpacing: 0.5 },

  facts: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 12, paddingTop: 12, paddingBottom: 4,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  fact: { flexDirection: 'row', width: '50%', paddingHorizontal: 4, marginBottom: 12 },
  factLabel: { fontFamily: 'Raleway_500Medium', fontSize: 10.5, color: COLORS.textMuted },
  factValue: { fontFamily: 'Raleway_700Bold', fontSize: 13, color: COLORS.text, marginTop: 1 },

  claimRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, backgroundColor: COLORS.bgAlt,
  },
  claimTitle: { ...FONTS.h4, fontSize: 14 },
  claimSub: { fontFamily: 'Raleway_400Regular', fontSize: 12, color: COLORS.textSecondary, marginTop: 2, lineHeight: 17 },
  claimBtn: {
    backgroundColor: COLORS.primary, paddingHorizontal: 18, paddingVertical: 11,
    borderRadius: 12,
  },
  claimBtnText: { fontFamily: 'Raleway_700Bold', fontSize: 13, color: '#FFF' },

  stateRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 16, backgroundColor: COLORS.bgAlt,
  },
  stateText: { fontFamily: 'Raleway_600SemiBold', fontSize: 12.5, color: COLORS.textSecondary, flex: 1, marginLeft: 8 },

  modalWrap: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: COLORS.bg, borderTopLeftRadius: 22, borderTopRightRadius: 22,
    padding: 20, maxHeight: '85%',
  },
  modalHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  modalTitle: { ...FONTS.h3 },
  modalClose: {
    width: 34, height: 34, borderRadius: 10, backgroundColor: COLORS.bgDark,
    alignItems: 'center', justifyContent: 'center',
  },
  noticeRow: {
    flexDirection: 'row', gap: 8, backgroundColor: COLORS.bgAlt,
    padding: 12, borderRadius: 12, marginBottom: 16,
  },
  noticeText: { fontFamily: 'Raleway_400Regular', fontSize: 12, color: COLORS.textSecondary, flex: 1, lineHeight: 17, marginLeft: 8 },
  fieldLabel: { fontFamily: 'Raleway_600SemiBold', fontSize: 12.5, color: COLORS.text, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16,
    fontFamily: 'Raleway_500Medium', fontSize: 14, color: COLORS.text,
    backgroundColor: COLORS.surface,
  },
  textarea: { height: 100 },
  submitBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14, height: 50,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  submitText: { fontFamily: 'Raleway_700Bold', fontSize: 15, color: '#FFF' },
});
