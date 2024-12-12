import React, { useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Provider, Card, Title, Paragraph, Dialog, Portal, ProgressBar, IconButton } from "react-native-paper";
import * as SecureStore from "expo-secure-store";
import { DOMAIN, TIMEOUT } from "../utils/service_info";
import axios from "axios";
import challenges from "../utils/challenge_list";

const CHALLENGE_STORE_KEY = "CompleteArchive";
const COUNT_ACHIEVEMENTS_KEY = "CountAchievements";

async function fetchCompletedAchievements() {
    try {
        const completedData = await SecureStore.getItemAsync(CHALLENGE_STORE_KEY);
        if (completedData) {
            return JSON.parse(completedData);
        } else {
            await SecureStore.setItemAsync(CHALLENGE_STORE_KEY, JSON.stringify([]));
            return [];
        }
    } catch (error) {
        console.error("Error fetching completed achievements:", error);
        return [];
    }
}

async function fetchCountAchievements() {
    try {
        const countData = await SecureStore.getItemAsync(COUNT_ACHIEVEMENTS_KEY);
        return countData ? parseInt(countData, 10) : 0;
    } catch (error) {
        console.error("Error fetching count achievements:", error);
        return 0;
    }
}

async function updateAchievementsIfNeeded(completedAchievements) {
    // 조건:
    // 10개 달성시 CountAchievements = 1 저장 및 challenge_id = 47
    // 30개 달성시 CountAchievements = 2 저장 및 challenge_id = 48
    // 49개 달성시 CountAchievements = 3 저장 및 challenge_id = 49
    //
    // 이미 10/30/49개를 달성한 상태인데 SecureStore에 저장되어 있지 않다면,
    // 해당 조건을 만족하는 모든 도전과제를 순차적으로 저장 및 서버에 요청.

    // 현재 상태 가져오기
    const storedUuid = await SecureStore.getItemAsync("user_uuid");
    const archiveString = await SecureStore.getItemAsync(CHALLENGE_STORE_KEY);
    const archiveValues = archiveString ? JSON.parse(archiveString) : [];
    let countAchievements = await fetchCountAchievements();

    // 체크용 함수
    async function checkAndUpdate(threshold, newCount, challengeId) {
        if (completedAchievements >= threshold && countAchievements < newCount) {
            // CountAchievements 갱신
            countAchievements = newCount;
            await SecureStore.setItemAsync(COUNT_ACHIEVEMENTS_KEY, countAchievements.toString());

            // 해당 challengeId가 archiveValues에 없으면 추가
            if (!archiveValues.includes(challengeId)) {
                archiveValues.push(challengeId);
                await SecureStore.setItemAsync(CHALLENGE_STORE_KEY, JSON.stringify(archiveValues));

                // 서버로 요청 (조건에 맞는 challengeId 하나만)
                try {
                    await axios.post(`${DOMAIN}/challenge/register`, {
                        "user_uuid": storedUuid,
                        "challenge_id": challengeId
                    }, { timeout: TIMEOUT });
                } catch (error) {
                    console.error("Error sending challenge register request:", error);
                }
            }
        }
    }

    // 순서대로 체크
    await checkAndUpdate(10, 1, 47);
    await checkAndUpdate(30, 2, 48);
    await checkAndUpdate(49, 3, 49);
}

function AchievementsPage() {
    const [completed, setCompleted] = useState([]);
    const [selectedAchievement, setSelectedAchievement] = useState(null);

    const loadData = async () => {
        const completedData = await fetchCompletedAchievements();
        setCompleted(completedData);
    };

    useEffect(() => {
        loadData();
    }, []);

    // 로드 완료 후 진행도 계산 및 조건 체크
    useEffect(() => {
        const processAchievements = async () => {
            const totalAchievements = challenges.length || 0;
            const completedAchievements = challenges.filter((challenge) =>
                completed.includes(challenge.id)
            ).length;

            // 도전과제 달성 수에 따른 업데이트
            await updateAchievementsIfNeeded(completedAchievements);
        };

        processAchievements();
    }, [completed]);

    const totalAchievements = challenges.length || 0;
    const completedAchievements = challenges.filter((challenge) =>
        completed.includes(challenge.id)
    ).length;

    const calculateProgress = () => {
        if (totalAchievements === 0) return 0;

        // 진행도를 0 ~ 1 사이로 반환
        const progress = completedAchievements / totalAchievements;
        return progress > 1 ? 1 : progress;
    };

    const progressPercentage = calculateProgress();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>도전과제</Text>
                <IconButton
                    icon="refresh"
                    color="#2196f3"
                    size={24}
                    onPress={loadData}
                    style={styles.refreshButton}
                />
            </View>
            <View style={styles.progressContainer}>
                <Text style={styles.progressText}>
                    진행도: {completedAchievements} / {totalAchievements}
                </Text>
                <ProgressBar
                    progress={progressPercentage}
                    color="#4caf50"
                    style={styles.progressBar}
                />
            </View>
            <FlatList
                data={challenges}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContainer}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => setSelectedAchievement(item)}>
                        <Card style={[styles.card, completed.includes(item.id) && styles.completedCard]}>
                            <Card.Content style={styles.cardContent}>
                                <IconButton
                                    icon="trophy"
                                    color={completed.includes(item.id) ? "#ffc107" : "#9e9e9e"}
                                    style={styles.trophyIcon}
                                    size={24}
                                />
                                <View>
                                    <Title style={styles.cardTitle}>{item.name}</Title>
                                    <Paragraph style={styles.cardText}>
                                        {completed.includes(item.id) ? "완료" : "미완료"}
                                    </Paragraph>
                                </View>
                            </Card.Content>
                        </Card>
                    </TouchableOpacity>
                )}
            />
            <Portal>
                <Dialog visible={!!selectedAchievement} onDismiss={() => setSelectedAchievement(null)}>
                    <Dialog.Title style={styles.dialogTitle}>{selectedAchievement?.name}</Dialog.Title>
                    <Dialog.Content>
                        <Paragraph style={styles.dialogText}>{selectedAchievement?.description}</Paragraph>
                        <Text style={styles.dialogStatus}>
                            상태: {completed.includes(selectedAchievement?.id) ? "완료" : "미완료"}
                        </Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <TouchableOpacity onPress={() => setSelectedAchievement(null)}>
                            <Text style={styles.dialogButton}>닫기</Text>
                        </TouchableOpacity>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </SafeAreaView>
    );
}

export default function App() {
    return (
        <Provider>
            <AchievementsPage />
        </Provider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: "#ffffff",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#000000",
    },
    refreshButton: {
        margin: 0,
    },
    progressContainer: {
        marginBottom: 16,
    },
    progressText: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 8,
        color: "#000000",
    },
    progressBar: {
        height: 8,
        borderRadius: 4,
    },
    listContainer: {
        paddingBottom: 16,
    },
    card: {
        marginBottom: 12,
        borderRadius: 8,
        elevation: 2,
        backgroundColor: "#ffffff",
    },
    completedCard: {
        backgroundColor: "#e8f5e9",
    },
    cardContent: {
        flexDirection: "row",
        alignItems: "center",
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#000000",
    },
    cardText: {
        fontSize: 14,
        color: "#757575",
    },
    trophyIcon: {
        marginRight: 16,
    },
    dialogTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#000000",
    },
    dialogText: {
        fontSize: 16,
        color: "#000000",
    },
    dialogStatus: {
        marginTop: 16,
        fontSize: 14,
        fontWeight: "600",
        color: "#000000",
    },
    dialogButton: {
        fontSize: 16,
        color: "#2196f3",
        marginHorizontal: 8,
        marginVertical: 4,
    },
});
