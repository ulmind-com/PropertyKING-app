import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable, Image, Dimensions, TextInput, FlatList, StatusBar, Linking, Platform, Modal, Alert, Animated, KeyboardAvoidingView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { WebView } from '../../components/WebView/WebViewComponent';
import * as Location from 'expo-location';
import { COLORS, FONTS, SHADOWS, SIZES } from '../../theme';
import { inquiryAPI, favoriteAPI, propertyAPI } from '../../api';
import { useCompare } from '../../context/CompareContext';
import { useAuth } from '../../context/AuthContext';

// Extract YouTube video ID from any YT URL format
const getYouTubeId = (url) => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
};

// Build YouTube embed URL
const getYTEmbedUrl = (videoId) =>
  `https://www.youtube.com/embed/${videoId}?playsinline=1&rel=0&modestbranding=1&loop=1&playlist=${videoId}&iv_load_policy=3&fs=0`;

import { MapView, Marker, Polyline } from '../../components/Map/MapViewComponent';

const { width } = Dimensions.get('window');

// Pre-compute at module level — ZERO work on component mount
const NEXT_30_DAYS = (() => {
  const days = [];
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  for (let i = 0; i < 30; i++) {
    const d = new Date(); d.setDate(d.getDate() + i);
    days.push({
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dayNames[d.getDay()],
      date: d.getDate(),
      month: monthNames[d.getMonth()],
      value: d.toISOString().split('T')[0],
    });
  }
  return days;
})();

const TIME_SLOTS = (() => {
  const slots = [];
  for (let i = 8; i <= 20; i++) {
    const ampm = i >= 12 ? 'PM' : 'AM';
    const hour = i > 12 ? i - 12 : (i === 0 ? 12 : i);
    let icon = i >= 18 ? 'moon-outline' : i >= 16 ? 'partly-sunny-outline' : i >= 12 ? 'sunny' : 'sunny-outline';
    slots.push({ label: `${hour}:00 ${ampm}`, value: `${i.toString().padStart(2, '0')}:00`, icon });
    if (i < 20) {
      slots.push({ label: `${hour}:30 ${ampm}`, value: `${i.toString().padStart(2, '0')}:30`, icon });
    }
  }
  return slots;
})();

const CONTACT_OPTIONS = [
  { label: 'Call', value: 'call', icon: 'call' },
  { label: 'WhatsApp', value: 'whatsapp', icon: 'logo-whatsapp' },
  { label: 'In Person', value: 'in_person', icon: 'people' },
  { label: 'Video', value: 'video', icon: 'videocam' },
];

const DateChip = React.memo(({ day, isSelected, onSelect }) => (
  <TouchableOpacity
    activeOpacity={0.7}
    delayPressIn={0}
    style={[styles.dateChip, isSelected && styles.dateChipActive]}
    onPress={() => onSelect(day.value)}
  >
    <Text style={[styles.dateChipLabel, isSelected && styles.dateChipTextActive]}>{day.label}</Text>
    <Text style={[styles.dateChipDate, isSelected && styles.dateChipTextActive]}>{day.date}</Text>
    <Text style={[styles.dateChipMonth, isSelected && styles.dateChipTextActive]}>{day.month}</Text>
  </TouchableOpacity>
));

const TimeChip = React.memo(({ slot, isSelected, onSelect }) => (
  <TouchableOpacity
    activeOpacity={0.7}
    delayPressIn={0}
    style={[styles.timeChip, isSelected && styles.timeChipActive]}
    onPress={() => onSelect(slot.value)}
  >
    <Ionicons name={slot.icon} size={16} color={isSelected ? '#FFF' : COLORS.textMuted} />
    <Text style={[styles.timeChipText, isSelected && styles.timeChipTextActive]}>{slot.label}</Text>
  </TouchableOpacity>
));

const ContactChip = React.memo(({ opt, isSelected, onSelect }) => (
  <TouchableOpacity
    activeOpacity={0.7}
    delayPressIn={0}
    style={[styles.contactChip, isSelected && styles.contactChipActive]}
    onPress={() => onSelect(opt.value)}
  >
    <Ionicons name={opt.icon} size={18} color={isSelected ? '#FFF' : COLORS.primary} />
    <Text style={[styles.contactChipText, isSelected && { color: '#FFF' }]}>{opt.label}</Text>
  </TouchableOpacity>
));

const ScheduleMeetingModal = forwardRef(({ property }, ref) => {
  const [showInquiry, setShowInquiry] = useState(false);
  const [inquiryMsg, setInquiryMsg] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [contactPref, setContactPref] = useState('call');
  const [inquiryLoading, setInquiryLoading] = useState(false);

  useImperativeHandle(ref, () => ({
    open: () => setShowInquiry(true),
    close: () => setShowInquiry(false),
  }));

  const handleInquiry = async () => {
    if (!inquiryMsg.trim() || inquiryMsg.trim().length < 10) {
      return Alert.alert('Message Required', 'Please write at least 10 characters describing your interest.');
    }
    if (!selectedDate) return Alert.alert('Select Date', 'Please pick a preferred meeting date.');
    if (!selectedTime) return Alert.alert('Select Time', 'Please pick a preferred time slot.');

    setInquiryLoading(true);
    try {
      await inquiryAPI.create({
        property_id: property.id,
        message: inquiryMsg,
        inquiry_type: 'viewing',
        preferred_date: selectedDate,
        preferred_time: selectedTime,
        contact_preference: contactPref,
      });
      setShowInquiry(false);
      setInquiryMsg('');
      setSelectedDate(null);
      setSelectedTime(null);
      setContactPref('call');
      Alert.alert('Meeting Requested! ✅', 'The property owner will review your request and get back to you soon.');
    } catch(e) {
      Alert.alert('Error', 'Failed to submit. Please try again.');
    }
    setInquiryLoading(false);
  };

  // EXACTLY like website: {showMeetingModal && (<div className="fixed inset-0">...)}
  // NO Modal component = NO new native Android Window = ZERO first-touch delay
  if (!showInquiry) return null;

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, elevation: 999 }}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Backdrop — tap to close (same as website's onClick on outer div) */}
        <TouchableOpacity activeOpacity={1} style={{ flex: 1 }} onPress={() => setShowInquiry(false)} />

        {/* Bottom sheet */}
        <View style={[styles.modalSheet, { maxHeight: Platform.OS === 'ios' ? '85%' : '90%' }]}>
          <View style={styles.sheetHandle} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <Text style={styles.sheetTitle}>Schedule a Meeting</Text>
            <Text style={styles.sheetSub}>Pick a date & time to visit this property</Text>

            {/* 📅 Date — same as website: getNext30Days().map(day => <button onClick>) */}
            <Text style={styles.pickerLabel}>📅 Preferred Date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always" contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
              {NEXT_30_DAYS.map((day) => (
                <DateChip key={day.value} day={day} isSelected={selectedDate === day.value} onSelect={setSelectedDate} />
              ))}
            </ScrollView>

            {/* 🕐 Time — same as website: getTimeSlots().map(slot => <button onClick>) */}
            <Text style={[styles.pickerLabel, { marginTop: 18 }]}>🕐 Preferred Time</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always" contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
              {TIME_SLOTS.map((slot) => (
                <TimeChip key={slot.value} slot={slot} isSelected={selectedTime === slot.value} onSelect={setSelectedTime} />
              ))}
            </ScrollView>

            {/* 💬 Contact — same as website: contactOptions.map(opt => <button onClick>) */}
            <Text style={[styles.pickerLabel, { marginTop: 18 }]}>💬 Contact Preference</Text>
            <View style={styles.contactGrid}>
              {CONTACT_OPTIONS.map((opt) => (
                <ContactChip key={opt.value} opt={opt} isSelected={contactPref === opt.value} onSelect={setContactPref} />
              ))}
            </View>

            {/* 📝 Message */}
            <Text style={[styles.pickerLabel, { marginTop: 18 }]}>📝 Your Message</Text>
            <TextInput
              style={styles.msgInput}
              placeholder="Hi, I'd love to visit this property and discuss..."
              placeholderTextColor={COLORS.textMuted}
              value={inquiryMsg}
              onChangeText={setInquiryMsg}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            {/* Submit */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.submitBtn, inquiryLoading && { opacity: 0.6 }]}
              onPress={handleInquiry}
              disabled={inquiryLoading}
            >
              <Ionicons name="calendar-outline" size={20} color="#FFF" />
              <Text style={styles.submitBtnText}>{inquiryLoading ? 'Submitting...' : 'Request Meeting'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
});

export default function PropertyDetailsScreen({ route, navigation }) {
  const { user } = useAuth();
  const { isInCompare, addToCompare, removeFromCompare } = useCompare();
  const property = route.params?.property || {};
  const passedUserCoords = route.params?.userCoords; // Priority to user selected location
  
  const [currentImg, setCurrentImg] = useState(0);
  const [liked, setLiked] = useState(false);
  const inquiryModalRef = useRef(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const flatListRef = useRef(null);
  
  const [userCoords, setUserCoords] = useState(passedUserCoords || null);
  const [distance, setDistance] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const mapRef = useRef(null);

  const propCoords = property.location?.coordinates?.coordinates; // [lng, lat]
  const propLat = propCoords ? propCoords[1] : 0;
  const propLng = propCoords ? propCoords[0] : 0;

  useEffect(() => {
    (async () => {
      let uC = passedUserCoords;
      if (!uC) {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            uC = { lat: loc.coords.latitude, lng: loc.coords.longitude };
            setUserCoords(uC);
          }
        } catch(e) {}
      }

      if (uC && propLat !== 0) {
        // Calculate Haversine direct distance
        const R = 6371;
        const dLat = (propLat - uC.lat) * Math.PI / 180;
        const dLon = (propLng - uC.lng) * Math.PI / 180;
        const a = Math.sin(dLat/2)**2 + Math.cos(uC.lat*Math.PI/180)*Math.cos(propLat*Math.PI/180)*Math.sin(dLon/2)**2;
        setDistance((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1));

        // Fetch OSRM Route for Zomato-style Map
        try {
          const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${uC.lng},${uC.lat};${propLng},${propLat}?overview=full&geometries=geojson`);
          const data = await res.json();
          if (data.routes && data.routes[0]) {
            // OSRM returns [lng, lat], map to {latitude, longitude}
            const coords = data.routes[0].geometry.coordinates.map(c => ({ latitude: c[1], longitude: c[0] }));
            setRouteCoords(coords);
            setTimeout(() => {
              if (mapRef && mapRef.current && typeof mapRef.current.fitToCoordinates === 'function') {
                try {
                  mapRef.current.fitToCoordinates(coords, { edgePadding: { top: 40, right: 40, bottom: 40, left: 40 }, animated: true });
                } catch(e) {}
              }
            }, 1000);
          }
        } catch (e) {
          console.log('Routing error:', e);
        }
      }
    })();
  }, []);

  // Fetch full property to increment view count and record the viewer
  useEffect(() => {
    if (property.slug || property.id) {
      propertyAPI.getBySlug(property.slug || property.id)
        .catch(e => console.log('Error recording view:', e));
    }
  }, []);

  const openMap = () => {
    if (!propCoords || propCoords[0] === 0) return;
    const dest = `${propLat},${propLng}`;
    const origin = userCoords ? `${userCoords.lat},${userCoords.lng}` : '';
    const url = origin
      ? `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}`
      : `https://www.google.com/maps/search/?api=1&query=${dest}`;
    Linking.openURL(url);
  };

  const images = property.images?.length > 0 ? property.images : [{ url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800' }];
  const d = property.details || {};

  const formatPrice = (p, u) => {
    const f = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(p || 0);
    return u === 'per_month' ? `${f}/mo` : u === 'per_night' ? `${f}/night` : f;
  };

  const handleFav = async () => {
    try { if (liked) await favoriteAPI.remove(property.id); else await favoriteAPI.add(property.id); setLiked(!liked); } catch(e) {}
  };

  const details = [
    d.bedrooms > 0 && { icon: 'bed-outline', label: 'Bedrooms', value: d.bedrooms },
    d.bathrooms > 0 && { icon: 'water-outline', label: 'Bathrooms', value: d.bathrooms },
    d.total_sqft > 0 && { icon: 'resize-outline', label: 'Area', value: `${d.total_sqft.toLocaleString()} sqft` },
    d.year_built > 0 && { icon: 'calendar-outline', label: 'Year Built', value: d.year_built },
    d.garage_spaces > 0 && { icon: 'car-outline', label: 'Garage', value: d.garage_spaces },
    d.stories > 0 && { icon: 'layers-outline', label: 'Stories', value: d.stories },
  ].filter(Boolean);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Image Gallery */}
        <View style={styles.gallery}>
          <FlatList
            ref={flatListRef}
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setCurrentImg(Math.round(e.nativeEvent.contentOffset.x / width))}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item }) => (
              <Image source={{ uri: item.url }} style={styles.galleryImage} />
            )}
          />
          {/* Back & Compare Buttons */}
          <TouchableOpacity style={[styles.galleryBtn, styles.backBtn]} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.galleryBtn, styles.moreBtn, isInCompare(property.id) && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }]}
            onPress={() => isInCompare(property.id) ? removeFromCompare(property.id) : addToCompare(property)}
          >
            <Ionicons name="git-compare" size={20} color="#FFF" />
          </TouchableOpacity>
          {/* Page Indicator */}
          <View style={styles.pageIndicator}>
            {images.map((_, i) => (
              <View key={i} style={[styles.dot, currentImg === i && styles.dotActive]} />
            ))}
          </View>
          {/* Title on Image */}
          <View style={styles.galleryOverlay}>
            <Text style={styles.galleryTitle}>{property.property_type_name || 'Property'} Details</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title & Location */}
          <Text style={FONTS.h2}>{property.title}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="navigate" size={14} color={COLORS.primary} />
            <Text style={[FONTS.caption, { flex: 1 }]}>
              {property.location?.address && `${property.location.address} • `}
              {property.location?.city}, {property.location?.state} {property.location?.zip_code}
            </Text>
          </View>

          {/* Listed By */}
          <View style={styles.listerCard}>
            <View style={styles.listerAvatar}>
              {(property.listed_by === user?.id && user?.avatar) || property.lister_avatar ? (
                <Image source={{ uri: property.listed_by === user?.id && user?.avatar ? user.avatar : property.lister_avatar }} style={styles.listerImg} />
              ) : (
                <Text style={styles.listerInitials}>{((property.listed_by === user?.id && user?.full_name ? user.full_name : property.lister_name) || 'U')[0].toUpperCase()}</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.listerName}>{property.listed_by === user?.id && user?.full_name ? user.full_name : (property.lister_name || 'Anonymous Lister')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Ionicons name="checkmark-circle" size={14} color={COLORS.primary} />
                <Text style={styles.listerType}>{property.lister_type ? property.lister_type.replace('_', ' ') : 'Verified Owner'}</Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={FONTS.h4}>Description</Text>
            <Text style={[FONTS.body, { marginTop: 8 }]} numberOfLines={descExpanded ? undefined : 3}>
              {property.description || 'This distressed or off-market property presents a unique opportunity in one of the most sought-after locations in the United States.'}
            </Text>
            <TouchableOpacity onPress={() => setDescExpanded(!descExpanded)}>
              <Text style={styles.readMore}>{descExpanded ? 'Show less' : 'Read More'}</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Details Grid */}
          <View style={styles.section}>
            <Text style={FONTS.h4}>Details</Text>
            <View style={styles.detailsGrid}>
              {details.map((d, i) => (
                <View key={i} style={styles.detailItem}>
                  <View style={styles.detailIcon}>
                    <Ionicons name={d.icon} size={20} color={COLORS.primary} />
                  </View>
                  <Text style={styles.detailValue}>{d.value}</Text>
                  <Text style={FONTS.caption}>{d.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Amenities */}
          {property.amenity_names?.length > 0 && (
            <View style={styles.section}>
              <Text style={FONTS.h4}>Amenities</Text>
              <View style={styles.amenityGrid}>
                {property.amenity_names.map((name, i) => (
                  <View key={i} style={styles.amenityChip}>
                    <Ionicons name="checkmark-circle" size={14} color={COLORS.primary} />
                    <Text style={styles.amenityText}>{name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* US Specific Details */}
          {(d.mls_number || d.property_tax_annual || d.hoa_fee > 0 || d.zoning) && (
            <View style={styles.section}>
              <Text style={FONTS.h4}>Property Info</Text>
              <View style={styles.infoList}>
                {d.mls_number && <View style={styles.infoRow}><Text style={styles.infoLabel}>MLS #</Text><Text style={styles.infoValue}>{d.mls_number}</Text></View>}
                {d.property_tax_annual > 0 && <View style={styles.infoRow}><Text style={styles.infoLabel}>Property Tax</Text><Text style={styles.infoValue}>${d.property_tax_annual?.toLocaleString()}/yr</Text></View>}
                {d.hoa_fee > 0 && <View style={styles.infoRow}><Text style={styles.infoLabel}>HOA Fee</Text><Text style={styles.infoValue}>${d.hoa_fee}/mo</Text></View>}
                {d.zoning && <View style={styles.infoRow}><Text style={styles.infoLabel}>Zoning</Text><Text style={styles.infoValue}>{d.zoning}</Text></View>}
                {d.parking_type && <View style={styles.infoRow}><Text style={styles.infoLabel}>Parking</Text><Text style={styles.infoValue}>{d.parking_type.replace(/_/g, ' ')}</Text></View>}
                {d.basement && <View style={styles.infoRow}><Text style={styles.infoLabel}>Basement</Text><Text style={styles.infoValue}>{d.basement}</Text></View>}
                {d.heating && <View style={styles.infoRow}><Text style={styles.infoLabel}>Heating</Text><Text style={styles.infoValue}>{d.heating}</Text></View>}
                {d.cooling && <View style={styles.infoRow}><Text style={styles.infoLabel}>Cooling</Text><Text style={styles.infoValue}>{d.cooling}</Text></View>}
              </View>
            </View>
          )}


          {/* Video Tour */}
          {property.video_url ? (() => {
            const ytId = getYouTubeId(property.video_url);
            return (
              <View style={styles.section}>
                <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
                  <Ionicons name="videocam" size={20} color={COLORS.primary} />
                  <Text style={FONTS.h4}>Video Tour</Text>
                </View>
                {ytId ? (
                  /* YouTube — inline embed with Referer header (fixes Error 153) */
                  <View style={styles.videoContainer}>
                    <WebView
                      style={styles.inlineVideo}
                      source={{
                        uri: getYTEmbedUrl(ytId),
                        headers: { 'Referer': 'https://propertyking.app' }
                      }}
                      javaScriptEnabled={true}
                      domStorageEnabled={true}
                      mediaPlaybackRequiresUserAction={false}
                      allowsInlineMediaPlayback={true}
                      scrollEnabled={false}
                      allowsFullscreenVideo={true}
                      mixedContentMode="always"
                      originWhitelist={['*']}
                    />
                  </View>
                ) : (
                  /* Direct uploaded video — native player */
                  <View style={styles.videoContainer}>
                    <Video
                      style={styles.inlineVideo}
                      source={{ uri: property.video_url }}
                      resizeMode={ResizeMode.COVER}
                      isLooping
                      shouldPlay
                      isMuted
                    />
                  </View>
                )}
              </View>
            );
          })() : null}

          {/* Floor Plans — right after video */}
          {((property.floor_plan_urls && property.floor_plan_urls.length > 0) || property.floor_plan_url) && (
            <View style={styles.section}>
              <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
                <Ionicons name="layers-outline" size={20} color={COLORS.primary} />
                <Text style={FONTS.h4}>Floor Plans</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, marginTop: 12, paddingRight: 4 }}>
                {(property.floor_plan_urls?.length > 0 ? property.floor_plan_urls : [property.floor_plan_url]).map((url, i) => (
                  <TouchableOpacity key={i} activeOpacity={0.9} style={styles.floorPlanCard}>
                    <Image source={{ uri: url }} style={styles.floorPlanImg} resizeMode="contain" />
                    <View style={styles.floorPlanLabel}>
                      <Ionicons name="map-outline" size={14} color="#FFF" />
                      <Text style={styles.floorPlanLabelText}>Plan {i + 1}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Location & Map */}
          <View style={styles.section}>
            <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
              <Text style={FONTS.h4}>Location</Text>
              {distance && (
                <TouchableOpacity style={styles.navigateBtn} onPress={openMap} activeOpacity={0.8}>
                  <Ionicons name="navigate" size={16} color="#FFF" />
                  <Text style={styles.navigateText}>Navigate ({distance} km)</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.addrBox}>
              <Ionicons name="location" size={20} color={COLORS.primary} />
              <View style={{flex:1}}>
                <Text style={FONTS.bodyBold}>{property.location?.address || 'Address available on request'}</Text>
                <Text style={FONTS.caption}>{property.location?.city}, {property.location?.state} {property.location?.zip_code}</Text>
                {property.location?.county && <Text style={FONTS.caption}>County: {property.location.county}</Text>}
              </View>
            </View>
            {propCoords && propCoords[0] !== 0 ? (
              <View style={styles.mapBox}>
                {Platform.OS === 'web' || !MapView ? (
                  <TouchableOpacity onPress={openMap} activeOpacity={0.85} style={{width:'100%', height:200, backgroundColor:COLORS.bgAlt, alignItems:'center', justifyContent:'center'}}>
                    <Ionicons name="map" size={40} color={COLORS.textMuted} />
                    <Text style={{...FONTS.body, marginTop:10}}>Map view requires mobile app</Text>
                    <Text style={{...FONTS.caption, color:COLORS.primary, marginTop:10}}>Click to open in Google Maps</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{width: '100%', height: 250, borderRadius: 16, overflow: 'hidden'}}>
                    <MapView
                      ref={mapRef}
                      style={StyleSheet.absoluteFillObject}
                      initialRegion={{
                        latitude: propLat,
                        longitude: propLng,
                        latitudeDelta: 0.05,
                        longitudeDelta: 0.05,
                      }}
                      zoomEnabled={true}
                      scrollEnabled={false}
                    >
                      <Marker coordinate={{ latitude: propLat, longitude: propLng }}>
                        <Ionicons name="location" size={40} color={COLORS.primary} style={{ marginTop: -20 }} />
                      </Marker>
                      {userCoords && (
                        <Marker coordinate={{ latitude: userCoords.lat, longitude: userCoords.lng }}>
                          <View style={{width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,150,255,0.2)', alignItems: 'center', justifyContent: 'center'}}>
                            <View style={{width: 10, height: 10, borderRadius: 5, backgroundColor: '#0066FF', borderWidth: 1.5, borderColor: '#FFF'}} />
                          </View>
                        </Marker>
                      )}
                      {routeCoords.length > 0 && (
                        <Polyline 
                          coordinates={routeCoords} 
                          strokeWidth={4} 
                          strokeColor="#3b82f6" 
                          lineDashPattern={[1]} 
                        />
                      )}
                    </MapView>
                  </View>
                )}
              </View>
            ) : (
              <View style={[styles.mapBox, {height:120, alignItems:'center', justifyContent:'center'}]}>
                <Ionicons name="map-outline" size={36} color={COLORS.textMuted}/>
                <Text style={FONTS.body}>Location unavailable</Text>
              </View>
            )}
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Bottom Price Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={FONTS.price}>{formatPrice(property.price, property.price_unit)}</Text>
          {property.price_unit === 'per_month' && <Text style={FONTS.caption}>per month</Text>}
        </View>
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.favBtnBottom} onPress={handleFav}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={22} color={liked ? COLORS.error : COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.checkoutBtn} onPress={() => inquiryModalRef.current?.open()}>
            <Text style={styles.checkoutText}>Inquire Now</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 🔹 Schedule Meeting Modal 🔹 */}
      <ScheduleMeetingModal ref={inquiryModalRef} property={property} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  gallery: { height: 360, position: 'relative' },
  galleryImage: { width, height: 360 },
  galleryBtn: { position: 'absolute', top: 52, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  backBtn: { left: 16 },
  moreBtn: { right: 16 },
  galleryOverlay: { position: 'absolute', top: 56, left: 0, right: 0, alignItems: 'center' },
  galleryTitle: { color: '#FFF', fontSize: 16, fontFamily: 'Raleway_700Bold' },
  pageIndicator: { position: 'absolute', bottom: 16, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { backgroundColor: '#FFF', width: 24 },

  content: { padding: 20, marginTop: -20, backgroundColor: COLORS.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24 },

  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  
  listerCard: { flexDirection: 'row', alignItems: 'center', marginTop: 16, padding: 12, backgroundColor: COLORS.bgAlt, borderRadius: SIZES.radius.lg, gap: 12, borderWidth: 1, borderColor: COLORS.borderLight },
  listerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  listerImg: { width: 44, height: 44 },
  listerInitials: { fontSize: 18, fontFamily: 'Raleway_800ExtraBold', color: '#FFF' },
  listerName: { fontSize: 14, fontFamily: 'Raleway_700Bold', color: COLORS.text },
  listerType: { fontSize: 12, fontFamily: 'Raleway_600SemiBold', color: COLORS.textMuted, textTransform: 'capitalize' },

  section: { marginTop: 24 },
  readMore: { color: COLORS.primary, fontFamily: 'Raleway_600SemiBold', fontSize: 14, marginTop: 6 },

  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  detailItem: { width: (width - 72) / 3, backgroundColor: COLORS.bgAlt, borderRadius: SIZES.radius.lg, padding: 14, alignItems: 'center', gap: 6 },
  detailIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primarySoft || COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  detailValue: { fontSize: 16, fontFamily: 'Raleway_700Bold', color: COLORS.text },

  infoList: { marginTop: 12, backgroundColor: COLORS.bgAlt, borderRadius: SIZES.radius.lg, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  infoLabel: { fontSize: 13, color: COLORS.textMuted },
  infoValue: { fontSize: 13, fontFamily: 'Raleway_600SemiBold', color: COLORS.text, textTransform: 'capitalize' },

  amenityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  amenityChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: COLORS.bgAlt, borderRadius: SIZES.radius.full },
  amenityText: { fontSize: 13, fontFamily: 'Raleway_500Medium', color: COLORS.textSecondary },

  mapPlaceholder: { marginTop: 12, backgroundColor: COLORS.bgAlt, borderRadius: SIZES.radius.lg, padding: 24, alignItems: 'center' },

  videoContainer: { marginTop: 12, width: '100%', height: 220, borderRadius: SIZES.radius.lg, overflow: 'hidden', backgroundColor: '#000', borderWidth: 1, borderColor: COLORS.borderLight, position: 'relative' },
  inlineVideo: { width: '100%', height: '100%' },
  videoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  playBtnWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  playBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 2, borderColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  playLabel: { color: '#FFF', fontSize: 13, fontFamily: 'Raleway_700Bold', marginTop: 8 },
  ytBadge: { position: 'absolute', bottom: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  ytBadgeText: { color: '#FFF', fontSize: 11, fontFamily: 'Raleway_700Bold' },
  floorPlanCard: { width: width * 0.75, height: 220, borderRadius: SIZES.radius.lg, overflow: 'hidden', backgroundColor: COLORS.bgAlt, borderWidth: 1, borderColor: COLORS.borderLight, position: 'relative' },
  floorPlanImg: { width: '100%', height: '100%' },
  floorPlanLabel: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, backgroundColor: 'rgba(0,0,0,0.55)' },
  floorPlanLabelText: { color: '#FFF', fontSize: 12, fontFamily: 'Raleway_700Bold' },
  navigateBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: SIZES.radius.full, backgroundColor: '#3b82f6', ...SHADOWS.sm },
  navigateText: { fontSize: 13, fontFamily: 'Raleway_700Bold', color: '#FFF' },
  addrBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 12, padding: 14, backgroundColor: COLORS.bgAlt, borderRadius: SIZES.radius.md },
  mapBox: { marginTop: 12, borderRadius: SIZES.radius.lg, overflow: 'hidden', backgroundColor: COLORS.bgAlt, borderWidth: 1, borderColor: COLORS.borderLight },
  mapImg: { width: '100%', height: 160 },
  mapOverlay: { padding: 16, alignItems: 'center', gap: 4 },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, paddingBottom: Platform.OS === 'ios' ? 28 : 12, backgroundColor: COLORS.bg, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  bottomActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  favBtnBottom: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: COLORS.borderLight, alignItems: 'center', justifyContent: 'center' },
  checkoutBtn: { height: 44, paddingHorizontal: 28, borderRadius: SIZES.radius.full, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', ...SHADOWS.primary },
  checkoutText: { color: '#FFF', fontSize: 14, fontFamily: 'Raleway_700Bold' },

  /* ─── Schedule Meeting Modal ─── */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalDismiss: { flex: 1 },
  modalSheet: { backgroundColor: COLORS.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 24, maxHeight: '85%' },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.borderLight, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 20, fontFamily: 'Raleway_800ExtraBold', color: COLORS.text },
  sheetSub: { fontSize: 13, color: COLORS.textMuted, marginTop: 4, marginBottom: 20 },

  pickerLabel: { fontSize: 14, fontFamily: 'Raleway_700Bold', color: COLORS.text, marginBottom: 10 },

  dateChip: { width: 72, paddingVertical: 12, borderRadius: SIZES.radius.lg, backgroundColor: COLORS.bgAlt, alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.borderLight },
  dateChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dateChipLabel: { fontSize: 11, fontFamily: 'Raleway_600SemiBold', color: COLORS.textMuted },
  dateChipDate: { fontSize: 22, fontFamily: 'Raleway_800ExtraBold', color: COLORS.text, marginVertical: 2 },
  dateChipMonth: { fontSize: 11, fontFamily: 'Raleway_600SemiBold', color: COLORS.textMuted },
  dateChipTextActive: { color: '#FFF' },

  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  timeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: SIZES.radius.full, backgroundColor: COLORS.bgAlt, borderWidth: 1.5, borderColor: COLORS.borderLight },
  timeChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  timeChipText: { fontSize: 13, fontFamily: 'Raleway_600SemiBold', color: COLORS.textSecondary },
  timeChipTextActive: { color: '#FFF' },

  contactGrid: { flexDirection: 'row', gap: 10 },
  contactChip: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 12, borderRadius: SIZES.radius.lg, backgroundColor: COLORS.bgAlt, borderWidth: 1.5, borderColor: COLORS.borderLight },
  contactChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  contactChipText: { fontSize: 11, fontFamily: 'Raleway_700Bold', color: COLORS.text },

  msgInput: { backgroundColor: COLORS.bgAlt, borderRadius: SIZES.radius.lg, padding: 14, fontSize: 14, color: COLORS.text, height: 80, borderWidth: 1, borderColor: COLORS.borderLight },

  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 54, borderRadius: SIZES.radius.lg, backgroundColor: COLORS.primary, marginTop: 20, ...SHADOWS.primary },
  submitBtnText: { color: '#FFF', fontSize: 16, fontFamily: 'Raleway_700Bold' },
});
