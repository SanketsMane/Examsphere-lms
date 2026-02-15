import React, { useEffect, useState } from 'react';
import { View, Modal, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { Typography, Button, Card, GlassCard } from '../ui';
import { Bell, Camera as CameraIcon, Image as ImageIcon, ShieldCheck } from 'lucide-react-native';

/**
 * Permission Gate Component
 * Ensures users are prompted for necessary permissions after sign-in.
 * Sanket
 */
export const PermissionGate = ({ children }: { children: React.ReactNode }) => {
  const [showModal, setShowModal] = useState(false);
  const [permissions, setPermissions] = useState({
    notifications: false,
    camera: false,
    mediaLibrary: false,
  });

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const { status: nStatus } = await Notifications.getPermissionsAsync();
    const { status: cStatus } = await Camera.getCameraPermissionsAsync();
    const { status: mStatus } = await MediaLibrary.getPermissionsAsync();

    const allGranted = nStatus === 'granted' && cStatus === 'granted' && mStatus === 'granted';
    
    setPermissions({
      notifications: nStatus === 'granted',
      camera: cStatus === 'granted',
      mediaLibrary: mStatus === 'granted',
    });

    if (!allGranted) {
      setShowModal(true);
    }
  };

  const requestAll = async () => {
    await Notifications.requestPermissionsAsync();
    await Camera.requestCameraPermissionsAsync();
    await MediaLibrary.requestPermissionsAsync();
    setShowModal(false);
  };

  return (
    <>
      {children}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
      >
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <GlassCard intensity={40} className="w-full border-0" innerClassName="p-8 items-center">
            <View className="w-16 h-16 bg-primary/20 rounded-2xl items-center justify-center mb-6">
              <ShieldCheck size={32} color="#3b82f6" />
            </View>
            
            <Typography variant="h3" weight="bold" className="text-center mb-2">Permissions Ready?</Typography>
            <Typography variant="p" className="text-center text-muted-foreground mb-8">
              To provide the best learning experience, Kidokool needs access to a few features.
            </Typography>

            <View className="w-full space-y-4 mb-10">
              <PermissionItem 
                icon={<Bell size={18} color="#3b82f6" />} 
                title="Notifications" 
                desc="Stay updated on live classes and exams."
              />
              <PermissionItem 
                icon={<CameraIcon size={18} color="#3b82f6" />} 
                title="Camera & Mic" 
                desc="Required for 1-1 mentorship sessions."
              />
              <PermissionItem 
                icon={<ImageIcon size={18} color="#3b82f6" />} 
                title="Media Library" 
                desc="Access resources and update your profile."
              />
            </View>

            <Button 
              label="Allow Access" 
              className="w-full h-14 rounded-2xl" 
              textClassName="font-bold"
              onPress={requestAll} 
            />
            
            <TouchableOpacity className="mt-4 p-2" onPress={() => setShowModal(false)}>
               <Typography variant="small" className="text-muted-foreground">Maybe Later</Typography>
            </TouchableOpacity>
          </GlassCard>
        </View>
      </Modal>
    </>
  );
};

const PermissionItem = ({ icon, title, desc }: { icon: any, title: string, desc: string }) => (
  <View className="flex-row items-center">
    <View className="w-10 h-10 bg-primary/10 rounded-xl items-center justify-center mr-4">
      {icon}
    </View>
    <View className="flex-1">
      <Typography weight="bold" className="text-sm">{title}</Typography>
      <Typography variant="small" className="opacity-60">{desc}</Typography>
    </View>
  </View>
);
