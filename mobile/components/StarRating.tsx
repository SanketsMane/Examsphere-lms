import React from "react";
import { View } from "react-native";
import { Star } from "lucide-react-native";

interface StarRatingProps {
  rating: number;
  size?: number;
  color?: string;
}

export const StarRating = ({ rating, size = 16, color = "#fbbf24" }: StarRatingProps) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <Star 
        key={i} 
        size={size} 
        color={color} 
        fill={i <= rating ? color : "transparent"} 
        strokeWidth={i <= rating ? 0 : 2}
        className="mr-1"
      />
    );
  }
  return <View className="flex-row">{stars}</View>;
};
