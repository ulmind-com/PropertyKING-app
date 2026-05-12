import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, TextInput, FlatList, StatusBar, Linking, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { COLORS, FONTS, SHADOWS, SIZES } from '../../theme';
import { inquiryAPI, favoriteAPI } from '../../api';

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

// Build YouTube autoplay HTML — uses IFrame Player API with origin trick
const buildYTAutoplayHTML = (videoId) => `
<!DOCTYPE html>
<html style="height:100%;width:100%">
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
  *{margin:0;padding:0}
  html,body{width:100%;height:100%;background:#000;overflow:hidden}
  #player,iframe{width:100%!important;height:100%!important;border:0}
</style>
</head>
<body>
<div id="player"></div>
<script>
  var tag=document.createElement('script');
  tag.src='https://www.youtube.com/iframe_api';
  var fs=document.getElementsByTagName('script')[0];
  fs.parentNode.insertBefore(tag,fs);
  var player;
  function onYouTubeIframeAPIReady(){
    player=new YT.Player('player',{
      width:'100%',height:'100%',
      videoId:'${videoId}',
      playerVars:{
        autoplay:1,mute:1,controls:0,loop:1,
        playlist:'${videoId}',playsinline:1,
        rel:0,modestbranding:1,showinfo:0,
        iv_load_policy:3,enablejsapi:1,
        origin:'https://www.youtube.com',
        widget_referrer:'https://www.youtube.com'
      },
      events:{
        onReady:function(e){
          e.target.mute();
          e.target.playVideo();
          setTimeout(function(){e.target.playVideo();},300);
          setTimeout(function(){e.target.playVideo();},800);
          setTimeout(function(){e.target.playVideo();},1500);
        }
      }
    });
  }
</script>
</body>
</html>`;

let MapView, Marker, Polyline;
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  Polyline = Maps.Polyline;
}

const { width } = Dimensions.get('window');

export default function PropertyDetailsScreen({ route, navigation }) {
  const property = route.params?.property || {};
  const passedUserCoords = route.params?.userCoords; // Priority to user selected location
  
  const [currentImg, setCurrentImg] = useState(0);
  const [liked, setLiked] = useState(false);
  const [showInquiry, setShowInquiry] = useState(false);
  const [inquiryMsg, setInquiryMsg] = useState('');
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

  const handleInquiry = async () => {
    if (!inquiryMsg.trim()) return;
    try { await inquiryAPI.create({ property_id: property.id, message: inquiryMsg, inquiry_type: 'general' }); setShowInquiry(false); setInquiryMsg(''); } catch(e) {}
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
          {/* Back & More Buttons */}
          <TouchableOpacity style={[styles.galleryBtn, styles.backBtn]} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.galleryBtn, styles.moreBtn]}>
            <Ionicons name="ellipsis-vertical" size={22} color="#FFF" />
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

          {/* Rating */}
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color={COLORS.accent} />
            <Text style={styles.ratingValue}>{property.average_rating || '4.7'} ratings</Text>
            <Text style={styles.ratingCount}>  ({property.reviews_count || '0'} reviewers)</Text>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={FONTS.h4}>Description</Text>
            <Text style={[FONTS.body, { marginTop: 8 }]} numberOfLines={descExpanded ? undefined : 3}>
              {property.description || 'This beautiful property offers premium living in one of the most sought-after locations in the United States.'}
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

          {/* Amenities */}
          {property.amenity_names?.length > 0 && (
            <View style={styles.section}>
              <Text style={FONTS.h4}>Amenities</Text>
              <View style={styles.amenitiesGrid}>
                {property.amenity_names.map((a, i) => (
                  <View key={i} style={styles.amenityChip}>
                    <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                    <Text style={styles.amenityText}>{a}</Text>
                  </View>
                ))}
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
                  /* YouTube — WebView + IFrame Player API + Origin trick */
                  <View style={styles.videoContainer}>
                    <WebView
                      style={styles.inlineVideo}
                      source={{ html: buildYTAutoplayHTML(ytId), baseUrl: 'https://www.youtube.com' }}
                      javaScriptEnabled={true}
                      domStorageEnabled={true}
                      mediaPlaybackRequiresUserAction={false}
                      allowsInlineMediaPlayback={true}
                      scrollEnabled={false}
                      allowsFullscreenVideo={false}
                      mixedContentMode="always"
                      originWhitelist={['*']}
                      setSupportMultipleWindows={false}
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
          <TouchableOpacity style={styles.checkoutBtn} onPress={() => setShowInquiry(true)}>
            <Text style={styles.checkoutText}>Inquire Now</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  galleryTitle: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  pageIndicator: { position: 'absolute', bottom: 16, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { backgroundColor: '#FFF', width: 24 },

  content: { padding: 20, marginTop: -20, backgroundColor: COLORS.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24 },

  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 4 },
  ratingValue: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  ratingCount: { fontSize: 13, color: COLORS.textMuted },

  section: { marginTop: 24 },
  readMore: { color: COLORS.primary, fontWeight: '600', fontSize: 14, marginTop: 6 },

  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  detailItem: { width: (width - 72) / 3, backgroundColor: COLORS.bgAlt, borderRadius: SIZES.radius.lg, padding: 14, alignItems: 'center', gap: 6 },
  detailIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primarySoft || COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  detailValue: { fontSize: 16, fontWeight: '700', color: COLORS.text },

  infoList: { marginTop: 12, backgroundColor: COLORS.bgAlt, borderRadius: SIZES.radius.lg, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  infoLabel: { fontSize: 13, color: COLORS.textMuted },
  infoValue: { fontSize: 13, fontWeight: '600', color: COLORS.text, textTransform: 'capitalize' },

  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  amenityChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: COLORS.bgAlt, borderRadius: SIZES.radius.full },
  amenityText: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },

  mapPlaceholder: { marginTop: 12, backgroundColor: COLORS.bgAlt, borderRadius: SIZES.radius.lg, padding: 24, alignItems: 'center' },

  videoContainer: { marginTop: 12, width: '100%', height: 220, borderRadius: SIZES.radius.lg, overflow: 'hidden', backgroundColor: '#000', borderWidth: 1, borderColor: COLORS.borderLight, position: 'relative' },
  inlineVideo: { width: '100%', height: '100%' },
  videoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  playBtnWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  playBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 2, borderColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  playLabel: { color: '#FFF', fontSize: 13, fontWeight: '700', marginTop: 8 },
  ytBadge: { position: 'absolute', bottom: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  ytBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  floorPlanCard: { width: width * 0.75, height: 220, borderRadius: SIZES.radius.lg, overflow: 'hidden', backgroundColor: COLORS.bgAlt, borderWidth: 1, borderColor: COLORS.borderLight, position: 'relative' },
  floorPlanImg: { width: '100%', height: '100%' },
  floorPlanLabel: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, backgroundColor: 'rgba(0,0,0,0.55)' },
  floorPlanLabelText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  navigateBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: SIZES.radius.full, backgroundColor: '#3b82f6', ...SHADOWS.sm },
  navigateText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  addrBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 12, padding: 14, backgroundColor: COLORS.bgAlt, borderRadius: SIZES.radius.md },
  mapBox: { marginTop: 12, borderRadius: SIZES.radius.lg, overflow: 'hidden', backgroundColor: COLORS.bgAlt, borderWidth: 1, borderColor: COLORS.borderLight },
  mapImg: { width: '100%', height: 160 },
  mapOverlay: { padding: 16, alignItems: 'center', gap: 4 },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 34, backgroundColor: COLORS.bg, borderTopWidth: 1, borderTopColor: COLORS.borderLight, ...SHADOWS.lg },
  bottomActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  favBtnBottom: { width: 48, height: 48, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  checkoutBtn: { paddingHorizontal: 28, height: 48, borderRadius: 14, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', ...SHADOWS.primary },
  checkoutText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
