import React from "react";
import { 
  Modal as RNModal, 
  View, 
  TouchableWithoutFeedback, 
  KeyboardAvoidingView, 
  Platform 
} from "react-native";
import { useColorScheme } from "nativewind";
import { cn } from "../../utils/cn";
import { Typography } from "./Typography";
import { X } from "lucide-react-native";
import { TouchableOpacity } from "react-native";

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Modal = ({ visible, onClose, title, children, className }: ModalProps) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              className={cn(
                "w-full bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-2xl",
                className
              )}
            >
              <View className="flex-row justify-between items-center mb-6">
                {title && (
                  <Typography variant="h4" weight="bold" className="text-slate-900 dark:text-white">
                    {title}
                  </Typography>
                )}
                <TouchableOpacity 
                  onPress={onClose}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center"
                >
                  <X size={16} color={isDark ? "#94a3b8" : "#64748b"} />
                </TouchableOpacity>
              </View>
              {children}
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};
