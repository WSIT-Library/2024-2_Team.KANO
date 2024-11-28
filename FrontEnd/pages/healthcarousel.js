import React from "react";
import { View, Text, StyleSheet, Image, Dimensions } from "react-native";


const { width: screenWidth } = Dimensions.get("window");

const HealthCarousel = () => {
    const carouselItems = [
        { title: "충분한 수면", image: require("../assets/sleep.png") },
        { title: "규칙적인 운동", image: require("../assets/exercise.png") },
        { title: "균형 잡힌 식사", image: require("../assets/healthy_food.png") },
        { title: "충분한 대화", image: require("../assets/talk.png") },
        { title: "스트레스 관리", image: require("../assets/stress_relief.png") },
    ];

    const renderCarouselItem = ({ item }) => (
        <View style={styles.carouselItem}>
            <Image source={item.image} style={styles.carouselImage} />
            <Text style={styles.carouselText}>{item.title}</Text>
        </View>
    );

    return (
        <Carousel
            data={carouselItems}
            renderItem={renderCarouselItem}
            sliderWidth={screenWidth}
            itemWidth={screenWidth * 0.8}
            loop={true}
        />
    );
};

const styles = StyleSheet.create({
    carouselItem: {
        backgroundColor: "#ffffff",
        borderRadius: 10,
        padding: 10,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 5,
    },
    carouselImage: {
        width: "100%",
        height: 150,
        resizeMode: "contain",
    },
    carouselText: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
        marginTop: 10,
    },
});

export default HealthCarousel;
