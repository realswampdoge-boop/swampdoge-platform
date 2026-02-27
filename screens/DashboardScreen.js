import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";

export default function DashboardScreen({
  walletAddress = "",
  isConnected = false,
  swampBalance = 0,
  isVip = false,
  todayPicksCount = 0,
  rewardsEarned = 0,
  onPressConnectWallet = () => {},
  onGoToPicks = () => {},
  onGoToRewards = () => {},
  onGoToLeaderboard = () => {},
  onGoToProfile = () => {},
}) {
  const shortAddr = useMemo(() => {
    if (!walletAddress || walletAddress.length < 10) return "";
    return `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;
  }, [walletAddress]);

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>SwampDoge</Text>
          <Text style={styles.tagline}>Utility • Picks • Rewards</Text>
        </View>

        <View style={[styles.pill, isConnected ? styles.pillOn : styles.pillOff]}>
          <Text style={styles.pillText}>
            {isConnected ? "Connected" : "Not Connected"}
          </Text>
        </View>
      </View>

      {/* WALLET CARD */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Wallet</Text>

        {isConnected ? (
          <>
            <Text style={styles.bigText}>{shortAddr}</Text>
            <Text style={styles.muted}>
              SWAMP Balance:{" "}
              <Text style={styles.bold}>
                {Number(swampBalance).toLocaleString()}
              </Text>
            </Text>

            <View style={styles.rowWrap}>
              <View
                style={[
                  styles.badge,
                  isVip ? styles.badgeVip : styles.badgeLocked,
                ]}
              >
                <Text style={styles.badgeText}>
                  {isVip ? "VIP UNLOCKED" : "VIP LOCKED"}
                </Text>
              </View>

              <View style={[styles.badge, styles.badgeInfo]}>
                <Text style={styles.badgeText}>
                  Rewards: {Number(rewardsEarned).toLocaleString()}
                </Text>
              </View>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.bigText}>Connect to start</Text>
            <Text style={styles.muted}>
              Connect your wallet to unlock picks and rewards.
            </Text>

            <Pressable
              style={styles.primaryBtn}
              onPress={onPressConnectWallet}
            >
              <Text style={styles.primaryBtnText}>Connect Wallet</Text>
            </Pressable>
          </>
        )}
      </View>

      {/* QUICK ACTIONS */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>

      <View style={styles.grid}>
        <ActionTile
          title="Today's Picks"
          subtitle={`${todayPicksCount} games`}
          onPress={onGoToPicks}
        />

        <ActionTile
          title="Rewards"
          subtitle="Claim + history"
          onPress={onGoToRewards}
        />

        <ActionTile
          title="Leaderboard"
          subtitle="Top pickers"
          onPress={onGoToLeaderboard}
        />

        <ActionTile
          title="Profile"
          subtitle="Rank + settings"
          onPress={onGoToProfile}
        />
      </View>

      {/* VIP SECTION */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>VIP Utility</Text>

        <Text style={styles.muted}>
          Hold <Text style={styles.bold}>1,000,000 SWAMP</Text> to unlock VIP
          picks and premium rewards.
        </Text>

        <View style={styles.progressBox}>
          <Text style={styles.progressText}>
            Status:{" "}
            <Text style={styles.bold}>
              {isVip ? "Unlocked ✅" : "Locked 🔒"}
            </Text>
          </Text>
        </View>
      </View>

      <Text style={styles.footer}>🐊 Next Level SwampDoge</Text>
    </ScrollView>
  );
}

function ActionTile({ title, subtitle, onPress }) {
  return (
    <Pressable style={styles.tile} onPress={onPress}>
      <Text style={styles.tileTitle}>{title}</Text>
      <Text style={styles.tileSub}>{subtitle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0B0F0E" },
  container: { padding: 16, paddingBottom: 28 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  brand: { color: "#E9FF76", fontSize: 24, fontWeight: "800" },
  tagline: { color: "#B7C2BE" },

  pill: { padding: 6, borderRadius: 999 },
  pillOn: { backgroundColor: "#1E3A2A" },
  pillOff: { backgroundColor: "#2B2B2B" },
  pillText: { color: "#FFF", fontWeight: "700" },

  card: {
    backgroundColor: "#121A18",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },

  cardTitle: { color: "#FFF", fontWeight: "800", marginBottom: 8 },
  bigText: { color: "#FFF", fontSize: 20, fontWeight: "800" },
  muted: { color: "#B7C2BE" },
  bold: { color: "#FFF", fontWeight: "900" },

  rowWrap: { flexDirection: "row", gap: 8, marginTop: 10 },

  badge: { padding: 8, borderRadius: 999 },
  badgeVip: { backgroundColor: "#2B4A1E" },
  badgeLocked: { backgroundColor: "#3A1E1E" },
  badgeInfo: { backgroundColor: "#1A2B3A" },
  badgeText: { color: "#FFF", fontWeight: "800" },

  primaryBtn: {
    marginTop: 12,
    backgroundColor: "#E9FF76",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  primaryBtnText: { fontWeight: "900" },

  sectionTitle: {
    color: "#FFF",
    fontWeight: "900",
    marginBottom: 10,
  },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },

  tile: {
    width: "48%",
    backgroundColor: "#121A18",
    borderRadius: 14,
    padding: 14,
  },

  tileTitle: { color: "#FFF", fontWeight: "900" },
  tileSub: { color: "#B7C2BE", marginTop: 4 },

  progressBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#0F1513",
    borderRadius: 12,
  },

  progressText: { color: "#FFF", fontWeight: "800" },

  footer: {
    textAlign: "center",
    color: "#7C8B86",
    marginTop: 10,
  },
});