import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, StatusBar, Image, Alert, ActivityIndicator, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { COLORS, FONTS, SHADOWS, SIZES } from '../../theme';
import { propertyAPI, propertyTypeAPI } from '../../api';
import api from '../../api';

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

export default function AddPropertyScreen({ navigation }) {
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [propertyTypeId, setPropertyTypeId] = useState('');
  const [propertyTypeName, setPropertyTypeName] = useState('');
  const [listingType, setListingType] = useState('sale');
  const [price, setPrice] = useState('');
  const [priceUnit, setPriceUnit] = useState('total');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateSel, setStateSel] = useState('');
  const [county, setCounty] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [gpsCoords, setGpsCoords] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [sqft, setSqft] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');
  const [images, setImages] = useState([]);
  const [videoUri, setVideoUri] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [floorPlanUrl, setFloorPlanUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  useEffect(() => { loadPropertyTypes(); }, []);

  const loadPropertyTypes = async () => {
    try { const r = await propertyTypeAPI.list(); setPropertyTypes(r.data || []); } catch(e) {}
  };

  const getGPS = async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission needed', 'Allow location access'); setGpsLoading(false); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setGpsCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      // Reverse geocode
      const [geo] = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      if (geo) {
        if (!address && geo.street) setAddress(`${geo.streetNumber || ''} ${geo.street}`.trim());
        if (!city && geo.city) setCity(geo.city);
        if (!stateSel && geo.region) setStateSel(geo.region.length === 2 ? geo.region : '');
        if (!zipCode && geo.postalCode) setZipCode(geo.postalCode);
        if (!county && geo.subregion) setCounty(geo.subregion);
      }
    } catch(e) { Alert.alert('Error', 'Could not get location'); }
    setGpsLoading(false);
  };

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, quality: 0.8, selectionLimit: 10 });
    if (!result.canceled && result.assets?.length > 0) {
      setUploading(true);
      try {
        const uploaded = [];
        for (const asset of result.assets) {
          const fd = new FormData();
          fd.append('file', { uri: asset.uri, type: 'image/jpeg', name: asset.fileName || `p_${Date.now()}.jpg` });
          const r = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
          if (r.data?.image?.url) uploaded.push({ url: r.data.image.url, caption: '', is_primary: images.length === 0 && uploaded.length === 0, order: images.length + uploaded.length });
        }
        setImages([...images, ...uploaded]);
      } catch(e) { Alert.alert('Upload Error', 'Failed to upload images'); }
      setUploading(false);
    }
  };

  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], quality: 0.7 });
    if (!result.canceled && result.assets?.[0]) {
      setUploading(true);
      try {
        const asset = result.assets[0];
        const fd = new FormData();
        fd.append('file', { uri: asset.uri, type: 'video/mp4', name: `vid_${Date.now()}.mp4` });
        const r = await api.post('/upload/video', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        if (r.data?.video?.url) { setVideoUrl(r.data.video.url); setVideoUri(asset.uri); }
      } catch(e) { Alert.alert('Upload Error', 'Failed to upload video'); }
      setUploading(false);
    }
  };

  const pickFloorPlan = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled && result.assets?.[0]) {
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append('file', { uri: result.assets[0].uri, type: 'image/jpeg', name: `fp_${Date.now()}.jpg` });
        const r = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        if (r.data?.image?.url) setFloorPlanUrl(r.data.image.url);
      } catch(e) { Alert.alert('Upload Error', 'Failed to upload floor plan'); }
      setUploading(false);
    }
  };

  const removeImage = (i) => { const u = images.filter((_, idx) => idx !== i); if (u.length > 0 && !u.some(x => x.is_primary)) u[0].is_primary = true; setImages(u); };
  const setPrimary = (i) => setImages(images.map((img, idx) => ({ ...img, is_primary: idx === i })));

  const validate = () => {
    setError('');
    if (step === 1) {
      if (!title || title.length < 5) return setError('Title: min 5 chars');
      if (!description || description.length < 20) return setError('Description: min 20 chars');
      if (!propertyTypeId) return setError('Select property type');
      if (!price || parseFloat(price) <= 0) return setError('Enter valid price');
    }
    if (step === 2) {
      if (!address) return setError('Enter address');
      if (!city) return setError('Enter city');
      if (!stateSel) return setError('Select state');
      if (!zipCode || !/^\d{5}(-\d{4})?$/.test(zipCode)) return setError('Enter valid ZIP');
    }
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    setError('');
    if (images.length === 0) return setError('Add at least one photo');
    setLoading(true);
    try {
      const locData = { address, city, state: stateSel.toUpperCase(), zip_code: zipCode };
      if (county) locData.county = county;
      if (gpsCoords) locData.coordinates = { type: 'Point', coordinates: [gpsCoords.lng, gpsCoords.lat] };
      const payload = {
        title, description, property_type_id: propertyTypeId, listing_type: listingType,
        price: parseFloat(price), price_unit: priceUnit,
        details: { bedrooms: parseInt(bedrooms)||0, bathrooms: parseFloat(bathrooms)||0, total_sqft: parseInt(sqft)||null, year_built: parseInt(yearBuilt)||null },
        location: locData, images,
        video_url: videoUrl || null,
        floor_plan_url: floorPlanUrl || null,
      };
      await propertyAPI.create(payload);
      Alert.alert('Submitted! 🎉', 'Property submitted for admin review.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch(e) {
      const d = e.response?.data?.detail;
      setError(Array.isArray(d) ? d[0].msg : (d || 'Submit failed'));
    }
    setLoading(false);
  };

  const titles = ['Basic Info', 'Location', 'Details', 'Media'];

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => step > 1 ? setStep(step-1) : navigation.goBack()} style={s.backBtn}><Ionicons name="chevron-back" size={24} color={COLORS.text} /></TouchableOpacity>
        <Text style={FONTS.h3}>Add Property</Text>
        <Text style={s.stepLabel}>Step {step}/4</Text>
      </View>
      <View style={s.progBar}>{[1,2,3,4].map(i=><View key={i} style={[s.progDot, i<=step&&s.progDotActive]}/>)}</View>
      <Text style={s.stepTitle}>{titles[step-1]}</Text>
      {error?<View style={s.errBox}><Ionicons name="alert-circle" size={16} color={COLORS.error}/><Text style={s.errText}>{error}</Text></View>:null}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingHorizontal:20,paddingTop:8}}>
        {step===1&&<View style={s.sc}>
          <View style={s.ig}><Text style={s.lb}>Property Title *</Text><TextInput style={s.inp} placeholder="e.g. Beautiful 3BR House" placeholderTextColor={COLORS.textMuted} value={title} onChangeText={setTitle}/></View>
          <View style={s.ig}><Text style={s.lb}>Description *</Text><TextInput style={[s.inp,{height:120,paddingTop:14}]} placeholder="Describe your property..." placeholderTextColor={COLORS.textMuted} value={description} onChangeText={setDescription} multiline textAlignVertical="top"/></View>
          <View style={s.ig}><Text style={s.lb}>Property Type *</Text>
            <TouchableOpacity style={s.selBtn} onPress={()=>setShowTypePicker(true)}><Text style={propertyTypeName?s.selTxt:s.selPh}>{propertyTypeName||'Select type'}</Text><Ionicons name="chevron-down" size={20} color={COLORS.textMuted}/></TouchableOpacity>
          </View>
          <View style={s.ig}><Text style={s.lb}>Listing Type *</Text>
            <View style={s.togRow}>{[{k:'sale',l:'For Sale',i:'pricetag'},{k:'rent',l:'For Rent',i:'key'}].map(t=>
              <TouchableOpacity key={t.k} style={[s.togBtn,listingType===t.k&&s.togBtnA]} onPress={()=>{setListingType(t.k);setPriceUnit(t.k==='rent'?'per_month':'total');}}>
                <Ionicons name={t.i} size={16} color={listingType===t.k?'#FFF':COLORS.textSecondary}/>
                <Text style={[s.togTxt,listingType===t.k&&s.togTxtA]}>{t.l}</Text>
              </TouchableOpacity>)}</View>
          </View>
          <View style={s.ig}><Text style={s.lb}>Price (USD) *</Text>
            <View style={{flexDirection:'row',alignItems:'center',gap:8}}><Text style={{fontSize:20,fontWeight:'700',color:COLORS.primary}}>$</Text>
              <TextInput style={[s.inp,{flex:1}]} placeholder="0" placeholderTextColor={COLORS.textMuted} value={price} onChangeText={setPrice} keyboardType="numeric"/>
              {listingType==='rent'&&<Text style={{fontSize:14,fontWeight:'600',color:COLORS.textMuted}}>/month</Text>}
            </View>
          </View>
        </View>}

        {step===2&&<View style={s.sc}>
          <TouchableOpacity style={s.gpsBtn} onPress={getGPS} disabled={gpsLoading}>
            {gpsLoading?<ActivityIndicator color={COLORS.primary}/>:<><Ionicons name="locate" size={20} color={COLORS.primary}/><Text style={s.gpsTxt}>Use Current GPS Location</Text></>}
          </TouchableOpacity>
          {gpsCoords&&<Text style={s.gpsInfo}>📍 {gpsCoords.lat.toFixed(5)}, {gpsCoords.lng.toFixed(5)}</Text>}
          <View style={s.ig}><Text style={s.lb}>Street Address *</Text><TextInput style={s.inp} placeholder="123 Main Street" placeholderTextColor={COLORS.textMuted} value={address} onChangeText={setAddress}/></View>
          <View style={s.ig}><Text style={s.lb}>City *</Text><TextInput style={s.inp} placeholder="New York" placeholderTextColor={COLORS.textMuted} value={city} onChangeText={setCity}/></View>
          <View style={{flexDirection:'row'}}>
            <View style={[s.ig,{flex:1}]}><Text style={s.lb}>State *</Text>
              <TouchableOpacity style={s.selBtn} onPress={()=>setShowStatePicker(true)}><Text style={stateSel?s.selTxt:s.selPh}>{stateSel||'Select'}</Text><Ionicons name="chevron-down" size={18} color={COLORS.textMuted}/></TouchableOpacity>
            </View>
            <View style={{width:12}}/>
            <View style={[s.ig,{flex:1}]}><Text style={s.lb}>ZIP Code *</Text><TextInput style={s.inp} placeholder="10001" placeholderTextColor={COLORS.textMuted} value={zipCode} onChangeText={setZipCode} keyboardType="numeric" maxLength={10}/></View>
          </View>
          <View style={s.ig}><Text style={s.lb}>County</Text><TextInput style={s.inp} placeholder="e.g. Kings County" placeholderTextColor={COLORS.textMuted} value={county} onChangeText={setCounty}/></View>
        </View>}

        {step===3&&<View style={s.sc}>
          <View style={{flexDirection:'row'}}>
            <View style={[s.ig,{flex:1}]}><Text style={s.lb}>Bedrooms</Text><TextInput style={s.inp} placeholder="3" placeholderTextColor={COLORS.textMuted} value={bedrooms} onChangeText={setBedrooms} keyboardType="numeric"/></View>
            <View style={{width:12}}/>
            <View style={[s.ig,{flex:1}]}><Text style={s.lb}>Bathrooms</Text><TextInput style={s.inp} placeholder="2" placeholderTextColor={COLORS.textMuted} value={bathrooms} onChangeText={setBathrooms} keyboardType="numeric"/></View>
          </View>
          <View style={{flexDirection:'row'}}>
            <View style={[s.ig,{flex:1}]}><Text style={s.lb}>Total Sqft</Text><TextInput style={s.inp} placeholder="1500" placeholderTextColor={COLORS.textMuted} value={sqft} onChangeText={setSqft} keyboardType="numeric"/></View>
            <View style={{width:12}}/>
            <View style={[s.ig,{flex:1}]}><Text style={s.lb}>Year Built</Text><TextInput style={s.inp} placeholder="2020" placeholderTextColor={COLORS.textMuted} value={yearBuilt} onChangeText={setYearBuilt} keyboardType="numeric" maxLength={4}/></View>
          </View>
        </View>}

        {step===4&&<View style={s.sc}>
          <Text style={[FONTS.h4,{marginBottom:8}]}>Photos *</Text>
          <TouchableOpacity style={s.addBox} onPress={pickImages} disabled={uploading}>
            {uploading?<ActivityIndicator color={COLORS.primary}/>:<><Ionicons name="camera-outline" size={32} color={COLORS.primary}/><Text style={s.addTxt}>Add Photos</Text></>}
          </TouchableOpacity>
          {images.length>0&&<View style={s.imgGrid}>{images.map((img,i)=>
            <View key={i} style={s.thumb}><Image source={{uri:img.url}} style={s.thumbImg}/>
              {img.is_primary&&<View style={s.coverBadge}><Text style={s.coverTxt}>Cover</Text></View>}
              <TouchableOpacity style={s.rmBtn} onPress={()=>removeImage(i)}><Ionicons name="close-circle" size={22} color={COLORS.error}/></TouchableOpacity>
              {!img.is_primary&&<TouchableOpacity style={s.setPrimBtn} onPress={()=>setPrimary(i)}><Text style={s.setPrimTxt}>Set cover</Text></TouchableOpacity>}
            </View>)}</View>}

          <Text style={[FONTS.h4,{marginTop:24,marginBottom:8}]}>Video (Optional)</Text>
          {videoUrl?<View style={s.mediaDone}><Ionicons name="videocam" size={24} color={COLORS.success}/><Text style={{flex:1,color:COLORS.success,fontWeight:'600'}}>Video uploaded</Text>
            <TouchableOpacity onPress={()=>{setVideoUrl('');setVideoUri(null);}}><Ionicons name="trash-outline" size={20} color={COLORS.error}/></TouchableOpacity></View>
          :<TouchableOpacity style={s.addBox} onPress={pickVideo} disabled={uploading}><Ionicons name="videocam-outline" size={28} color={COLORS.primary}/><Text style={s.addTxt}>Add Video</Text></TouchableOpacity>}

          <Text style={[FONTS.h4,{marginTop:24,marginBottom:8}]}>Floor Plan (Optional)</Text>
          {floorPlanUrl?<View style={s.fpDone}><Image source={{uri:floorPlanUrl}} style={s.fpImg}/>
            <TouchableOpacity style={s.rmBtn} onPress={()=>setFloorPlanUrl('')}><Ionicons name="close-circle" size={22} color={COLORS.error}/></TouchableOpacity></View>
          :<TouchableOpacity style={s.addBox} onPress={pickFloorPlan} disabled={uploading}><Ionicons name="map-outline" size={28} color={COLORS.primary}/><Text style={s.addTxt}>Add Floor Plan</Text></TouchableOpacity>}
        </View>}
        <View style={{height:120}}/>
      </ScrollView>

      <View style={s.bottomBar}>{step<4?
        <TouchableOpacity style={s.nextBtn} onPress={validate}><Text style={s.nextTxt}>Continue</Text><Ionicons name="arrow-forward" size={20} color="#FFF"/></TouchableOpacity>:
        <TouchableOpacity style={[s.submitBtn,loading&&{opacity:0.7}]} onPress={handleSubmit} disabled={loading}><Text style={s.submitTxt}>{loading?'Submitting...':'Submit Property'}</Text></TouchableOpacity>}
      </View>

      {/* Property Type Modal */}
      <Modal visible={showTypePicker} transparent animationType="slide">
        <View style={s.mo}><View style={s.mc}>
          <View style={s.mh}><Text style={FONTS.h3}>Property Type</Text><TouchableOpacity onPress={()=>setShowTypePicker(false)}><Ionicons name="close" size={24} color={COLORS.text}/></TouchableOpacity></View>
          <FlatList data={propertyTypes} keyExtractor={i=>i.id} renderItem={({item})=>
            <TouchableOpacity style={[s.opt,propertyTypeId===item.id&&s.optA]} onPress={()=>{setPropertyTypeId(item.id);setPropertyTypeName(item.name);setShowTypePicker(false);}}>
              <Text style={[s.optTxt,propertyTypeId===item.id&&s.optTxtA]}>{item.icon||'🏠'} {item.name}</Text>
              {propertyTypeId===item.id&&<Ionicons name="checkmark-circle" size={22} color={COLORS.primary}/>}
            </TouchableOpacity>}
            ListEmptyComponent={<View style={{padding:40,alignItems:'center'}}><Text style={FONTS.body}>No types yet</Text></View>}/>
        </View></View>
      </Modal>

      {/* State Picker Modal */}
      <Modal visible={showStatePicker} transparent animationType="slide">
        <View style={s.mo}><View style={s.mc}>
          <View style={s.mh}><Text style={FONTS.h3}>Select State</Text><TouchableOpacity onPress={()=>setShowStatePicker(false)}><Ionicons name="close" size={24} color={COLORS.text}/></TouchableOpacity></View>
          <FlatList data={US_STATES} keyExtractor={i=>i} renderItem={({item})=>
            <TouchableOpacity style={[s.opt,stateSel===item&&s.optA]} onPress={()=>{setStateSel(item);setShowStatePicker(false);}}>
              <Text style={[s.optTxt,stateSel===item&&s.optTxtA]}>{item}</Text>
              {stateSel===item&&<Ionicons name="checkmark-circle" size={22} color={COLORS.primary}/>}
            </TouchableOpacity>}/>
        </View></View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:COLORS.bg},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:20,paddingTop:56,paddingBottom:12},
  backBtn:{width:40,height:40,borderRadius:12,borderWidth:1,borderColor:COLORS.border,alignItems:'center',justifyContent:'center'},
  stepLabel:{fontSize:13,fontWeight:'600',color:COLORS.textMuted},
  progBar:{flexDirection:'row',paddingHorizontal:20,gap:6,marginBottom:6},
  progDot:{flex:1,height:4,borderRadius:2,backgroundColor:COLORS.borderLight},
  progDotActive:{backgroundColor:COLORS.primary},
  stepTitle:{...FONTS.caption,paddingHorizontal:20,marginBottom:8,color:COLORS.primary,textTransform:'uppercase',letterSpacing:1},
  errBox:{flexDirection:'row',alignItems:'center',gap:8,backgroundColor:COLORS.errorLight,padding:14,borderRadius:SIZES.radius.md,marginHorizontal:20,marginBottom:8},
  errText:{fontSize:13,color:COLORS.error,fontWeight:'500',flex:1},
  sc:{gap:20},ig:{gap:6},
  lb:{fontSize:13,fontWeight:'600',color:COLORS.textSecondary},
  inp:{backgroundColor:COLORS.bgAlt,borderRadius:SIZES.radius.md,paddingHorizontal:16,height:52,fontSize:14,color:COLORS.text,borderWidth:1,borderColor:COLORS.borderLight},
  selBtn:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',backgroundColor:COLORS.bgAlt,borderRadius:SIZES.radius.md,paddingHorizontal:16,height:52,borderWidth:1,borderColor:COLORS.borderLight},
  selTxt:{fontSize:14,color:COLORS.text},selPh:{fontSize:14,color:COLORS.textMuted},
  togRow:{flexDirection:'row',gap:10},
  togBtn:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,paddingVertical:14,borderRadius:SIZES.radius.md,borderWidth:1.5,borderColor:COLORS.border,backgroundColor:COLORS.bgAlt},
  togBtnA:{backgroundColor:COLORS.primary,borderColor:COLORS.primary},
  togTxt:{fontSize:14,fontWeight:'600',color:COLORS.textSecondary},togTxtA:{color:'#FFF'},
  gpsBtn:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,height:48,borderRadius:SIZES.radius.md,borderWidth:1.5,borderColor:COLORS.primary,borderStyle:'dashed',backgroundColor:COLORS.primarySoft},
  gpsTxt:{fontSize:14,fontWeight:'600',color:COLORS.primary},
  gpsInfo:{fontSize:12,color:COLORS.success,fontWeight:'600',textAlign:'center',marginTop:-8},
  addBox:{alignItems:'center',justifyContent:'center',height:120,borderRadius:SIZES.radius.lg,borderWidth:2,borderColor:COLORS.border,borderStyle:'dashed',backgroundColor:COLORS.bgAlt,gap:6},
  addTxt:{fontSize:14,fontWeight:'600',color:COLORS.primary},
  imgGrid:{flexDirection:'row',flexWrap:'wrap',gap:10,marginTop:12},
  thumb:{width:'30%',aspectRatio:1,borderRadius:SIZES.radius.md,overflow:'hidden',position:'relative'},
  thumbImg:{width:'100%',height:'100%'},
  rmBtn:{position:'absolute',top:4,right:4},
  coverBadge:{position:'absolute',top:4,left:4,backgroundColor:COLORS.primary,paddingHorizontal:6,paddingVertical:2,borderRadius:4},
  coverTxt:{fontSize:9,fontWeight:'700',color:'#FFF'},
  setPrimBtn:{position:'absolute',bottom:0,left:0,right:0,backgroundColor:'rgba(0,0,0,0.5)',paddingVertical:4,alignItems:'center'},
  setPrimTxt:{fontSize:10,fontWeight:'600',color:'#FFF'},
  mediaDone:{flexDirection:'row',alignItems:'center',gap:10,padding:16,backgroundColor:COLORS.successLight,borderRadius:SIZES.radius.md},
  fpDone:{width:120,aspectRatio:1,borderRadius:SIZES.radius.md,overflow:'hidden',position:'relative'},
  fpImg:{width:'100%',height:'100%'},
  bottomBar:{position:'absolute',bottom:0,left:0,right:0,padding:20,paddingBottom:34,backgroundColor:COLORS.bg,borderTopWidth:1,borderTopColor:COLORS.borderLight},
  nextBtn:{flexDirection:'row',height:54,backgroundColor:COLORS.primary,borderRadius:SIZES.radius.lg,alignItems:'center',justifyContent:'center',gap:8,...SHADOWS.primary},
  nextTxt:{color:'#FFF',fontSize:16,fontWeight:'700'},
  submitBtn:{height:54,backgroundColor:COLORS.success,borderRadius:SIZES.radius.lg,alignItems:'center',justifyContent:'center',...SHADOWS.sm},
  submitTxt:{color:'#FFF',fontSize:16,fontWeight:'700'},
  mo:{flex:1,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'flex-end'},
  mc:{backgroundColor:COLORS.bg,borderTopLeftRadius:24,borderTopRightRadius:24,maxHeight:'60%',paddingBottom:34},
  mh:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:20,borderBottomWidth:1,borderBottomColor:COLORS.borderLight},
  opt:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:20,paddingVertical:16,borderBottomWidth:1,borderBottomColor:COLORS.borderLight},
  optA:{backgroundColor:COLORS.primarySoft},
  optTxt:{fontSize:15,fontWeight:'500',color:COLORS.text},
  optTxtA:{color:COLORS.primary,fontWeight:'700'},
});
