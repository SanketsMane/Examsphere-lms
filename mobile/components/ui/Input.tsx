import React, { useState } from "react";
import { 
  View, 
  TextInput, 
  Text, 
  TextInputProps, 
  TouchableOpacity 
} from "react-native";
import { cn } from "../../utils/cn";
import { Eye, EyeOff } from "lucide-react-native";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
  isPassword?: boolean;
}

export const Input = React.forwardRef<TextInput, InputProps>(
  ({ label, error, leftIcon, rightIcon, containerClassName, isPassword, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(!isPassword);

    return (
      <View className={cn("mb-4 w-full", containerClassName)}>
        {label && (
          <Text className="text-muted-foreground text-sm font-semibold mb-2 ml-1">
            {label}
          </Text>
        )}
        
        <View 
          className={cn(
            "flex-row items-center bg-card border border-border rounded-xl px-4 h-14",
            isFocused && "border-primary",
            error && "border-destructive",
            props.editable === false && "opacity-50 bg-muted/20"
          )}
        >
          {leftIcon && <View className="mr-3">{leftIcon}</View>}
          
          <TextInput
            ref={ref}
            className="flex-1 text-foreground text-base h-full"
            placeholderTextColor="#94a3b8"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            secureTextEntry={isPassword && !showPassword}
            {...props}
          />
          
          {isPassword ? (
            <TouchableOpacity 
              onPress={() => setShowPassword(!showPassword)}
              className="ml-3"
            >
              {showPassword ? (
                <EyeOff size={20} color="#94a3b8" />
              ) : (
                <Eye size={20} color="#94a3b8" />
              )}
            </TouchableOpacity>
          ) : rightIcon && (
            <View className="ml-3">{rightIcon}</View>
          )}
        </View>
        
        {error && (
          <Text className="text-destructive text-xs mt-1 ml-1 font-medium">
            {error}
          </Text>
        )}
      </View>
    );
  }
);

Input.displayName = "Input";
