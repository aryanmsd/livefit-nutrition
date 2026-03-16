// app/(tabs)/redeem.tsx
import {
    View, Text, ScrollView, TouchableOpacity,
    Alert, ActivityIndicator, Modal
  } from "react-native";
  import { useContext, useState, useCallback } from "react";
  import { useFocusEffect } from "expo-router";
  import API from "../../src/services/api";
  import { CoinsContext } from "../../src/context/CoinsContext";
  import { globalStyles } from "../../src/theme/styles";
  import { colors } from "../../src/theme/colors";
  
  const REWARDS = [
    { id: "discount_10",      title: "10% Off Next Order",   desc: "Get 10% off your next meal order",        cost: 50,  icon: "🏷️", color: "#22c55e" },
    { id: "discount_20",      title: "20% Off Next Order",   desc: "Get 20% off your next meal order",        cost: 100, icon: "💸", color: "#3b82f6" },
    { id: "free_meal",        title: "Free Meal Upgrade",    desc: "Upgrade any meal to premium for free",    cost: 150, icon: "🍱", color: "#f59e0b" },
    { id: "pro_trial",        title: "7-Day Pro Trial",      desc: "Unlock all Pro features for 7 days",      cost: 200, icon: "⭐", color: "#8b5cf6" },
    { id: "free_delivery",    title: "Free Delivery",        desc: "Free delivery on your next 3 orders",     cost: 75,  icon: "🚚", color: "#ec4899" },
    { id: "nutrition_report", title: "Nutrition Deep Dive",  desc: "Personalised weekly nutrition report",    cost: 120, icon: "📊", color: "#14b8a6" }
  ];
  
  export default function Redeem() {
    const { coins, setCoins } = useContext(CoinsContext);
    const [redeeming, setRedeeming]     = useState<string | null>(null);
    const [myRewards, setMyRewards]     = useState<any[]>([]);
    const [codeModal, setCodeModal]     = useState<{ code: string; title: string } | null>(null);
    const [tab, setTab]                 = useState<"store" | "mine">("store");
  
    useFocusEffect(useCallback(() => {
      API.get("/api/coins").then(r => setCoins(r.data.coins)).catch(() => {});
      API.get("/api/my-rewards").then(r => setMyRewards(r.data)).catch(() => {});
    }, []));
  
    const handleRedeem = (reward: typeof REWARDS[0]) => {
      if (coins < reward.cost) {
        Alert.alert("Not Enough Coins", `You need ${reward.cost - coins} more coins.`);
        return;
      }
      Alert.alert(
        "Confirm Redemption",
        `Spend ${reward.cost} 🪙 for "${reward.title}"?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Redeem",
            onPress: async () => {
              setRedeeming(reward.id);
              try {
                const res = await API.post("/api/redeem", {
                  cost:        reward.cost,
                  rewardId:    reward.id,
                  rewardTitle: reward.title
                });
                setCoins(res.data.coins);
                // Refresh my rewards list
                const r2 = await API.get("/api/my-rewards");
                setMyRewards(r2.data);
                // Show the unique code in a modal
                setCodeModal({ code: res.data.code, title: reward.title });
              } catch (err: any) {
                Alert.alert("Failed", err?.response?.data?.error || "Try again");
              } finally {
                setRedeeming(null);
              }
            }
          }
        ]
      );
    };
  
    return (
      <View style={globalStyles.container}>
  
        {/* Balance banner */}
        <View style={{
          backgroundColor: colors.card, borderRadius: 16, padding: 20, marginBottom: 20,
          borderWidth: 1, borderColor: colors.primary + "50",
          flexDirection: "row", justifyContent: "space-between", alignItems: "center"
        }}>
          <View>
            <Text style={{ color: colors.muted, fontSize: 12, letterSpacing: 1 }}>YOUR BALANCE</Text>
            <Text style={{ color: colors.primary, fontSize: 34, fontWeight: "900", marginTop: 2 }}>
              {coins} 🪙
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ color: colors.muted, fontSize: 12 }}>+5 per food log</Text>
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>+20 per order</Text>
          </View>
        </View>
  
        {/* Tab switcher */}
        <View style={{
          flexDirection: "row", backgroundColor: colors.card,
          borderRadius: 12, padding: 4, marginBottom: 20,
          borderWidth: 1, borderColor: colors.cardBorder
        }}>
          {(["store", "mine"] as const).map(t => (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              style={{
                flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center",
                backgroundColor: tab === t ? colors.primary : "transparent"
              }}
            >
              <Text style={{
                color: tab === t ? "#000" : colors.muted,
                fontWeight: "800", fontSize: 13
              }}>
                {t === "store" ? "🎁 Store" : `🎫 My Rewards (${myRewards.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
  
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
  
          {/* ── STORE TAB ── */}
          {tab === "store" && REWARDS.map(reward => {
            const canAfford  = coins >= reward.cost;
            const isLoading  = redeeming === reward.id;
  
            return (
              <View key={reward.id} style={[globalStyles.card, {
                borderColor: canAfford ? reward.color + "50" : colors.cardBorder
              }]}>
                <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                  <View style={{
                    width: 50, height: 50, borderRadius: 14,
                    backgroundColor: reward.color + "20",
                    alignItems: "center", justifyContent: "center", marginRight: 14
                  }}>
                    <Text style={{ fontSize: 24 }}>{reward.icon}</Text>
                  </View>
  
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: 16, fontWeight: "800" }}>
                      {reward.title}
                    </Text>
                    <Text style={{ color: colors.muted, fontSize: 13, marginTop: 3, lineHeight: 18 }}>
                      {reward.desc}
                    </Text>
  
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
                      <Text style={{ color: canAfford ? colors.primary : colors.muted, fontWeight: "800", fontSize: 16 }}>
                        🪙 {reward.cost}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleRedeem(reward)}
                        disabled={!canAfford || isLoading}
                        style={{
                          backgroundColor: canAfford ? reward.color : "#1a3a5c",
                          borderRadius: 20, paddingHorizontal: 20, paddingVertical: 9,
                          minWidth: 90, alignItems: "center"
                        }}
                      >
                        {isLoading
                          ? <ActivityIndicator size="small" color="#fff" />
                          : <Text style={{ color: canAfford ? "#000" : colors.muted, fontWeight: "800", fontSize: 13 }}>
                              {canAfford ? "Redeem" : "🔒 Locked"}
                            </Text>
                        }
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
  
          {/* ── MY REWARDS TAB ── */}
          {tab === "mine" && (
            myRewards.length === 0
              ? (
                <View style={{ alignItems: "center", paddingTop: 40 }}>
                  <Text style={{ fontSize: 48 }}>🎫</Text>
                  <Text style={{ color: colors.muted, marginTop: 12, fontSize: 15 }}>
                    No rewards redeemed yet
                  </Text>
                </View>
              )
              : myRewards.map((r: any) => (
                <View key={r._id} style={[globalStyles.card, { borderColor: r.used ? colors.cardBorder : colors.success + "50" }]}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                    <Text style={{ color: colors.text, fontWeight: "800", fontSize: 15, flex: 1 }}>
                      {r.rewardTitle}
                    </Text>
                    <View style={{
                      backgroundColor: r.used ? "#1a3a5c" : "#0d2b1f",
                      borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3,
                      borderWidth: 1, borderColor: r.used ? colors.cardBorder : colors.success
                    }}>
                      <Text style={{ color: r.used ? colors.muted : colors.success, fontSize: 11, fontWeight: "700" }}>
                        {r.used ? "USED" : "ACTIVE"}
                      </Text>
                    </View>
                  </View>
  
                  {/* Redemption code — the actual reward */}
                  <View style={{
                    backgroundColor: "#070d1a", borderRadius: 10, padding: 14,
                    borderWidth: 1, borderColor: colors.cardBorder,
                    alignItems: "center", marginTop: 4
                  }}>
                    <Text style={{ color: colors.muted, fontSize: 11, letterSpacing: 2, marginBottom: 6 }}>
                      YOUR CODE
                    </Text>
                    <Text style={{
                      color: colors.primary, fontSize: 24, fontWeight: "900",
                      letterSpacing: 4, fontFamily: "monospace"
                    }}>
                      {r.code}
                    </Text>
                    <Text style={{ color: colors.muted, fontSize: 11, marginTop: 6 }}>
                      Show this code at checkout
                    </Text>
                  </View>
  
                  <Text style={{ color: colors.muted, fontSize: 11, marginTop: 10 }}>
                    Redeemed {new Date(r.redeemedAt).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric"
                    })}
                  </Text>
                </View>
              ))
          )}
        </ScrollView>
  
        {/* ── Code revealed modal ── */}
        <Modal visible={!!codeModal} transparent animationType="fade">
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center", padding: 24 }}>
            <View style={{
              backgroundColor: colors.card, borderRadius: 24, padding: 32,
              width: "100%", alignItems: "center",
              borderWidth: 1, borderColor: colors.primary
            }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>🎉</Text>
              <Text style={{ color: colors.text, fontSize: 20, fontWeight: "800", marginBottom: 6, textAlign: "center" }}>
                {codeModal?.title}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 14, marginBottom: 24, textAlign: "center" }}>
                Your unique redemption code:
              </Text>
  
              <View style={{
                backgroundColor: "#070d1a", borderRadius: 14, padding: 20,
                width: "100%", alignItems: "center",
                borderWidth: 1, borderColor: colors.primary
              }}>
                <Text style={{
                  color: colors.primary, fontSize: 28, fontWeight: "900",
                  letterSpacing: 6
                }}>
                  {codeModal?.code}
                </Text>
              </View>
  
              <Text style={{ color: colors.muted, fontSize: 13, marginTop: 16, textAlign: "center" }}>
                Show this at checkout. Find it anytime in My Rewards.
              </Text>
  
              <TouchableOpacity
                onPress={() => { setCodeModal(null); setTab("mine"); }}
                style={{
                  backgroundColor: colors.primary, borderRadius: 14,
                  paddingHorizontal: 32, paddingVertical: 14, marginTop: 24
                }}
              >
                <Text style={{ color: "#000", fontWeight: "800", fontSize: 16 }}>Got it!</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
  
      </View>
    );
  }