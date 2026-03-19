import React, { useEffect, useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "./ThemedText";
import { Card } from "./Card";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { getApiUrl } from "@/lib/query-client";

interface HealthStatus {
    status: "ok" | "degraded" | "down";
    timestamp: string;
    supabase?: {
        connected: boolean;
        error: string | null;
    };
}

export function ConnectionStatus() {
    const { theme } = useTheme();
    const [health, setHealth] = useState<HealthStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);

    const checkHealth = async () => {
        setIsLoading(true);
        try {
            const baseUrl = getApiUrl();
            const response = await fetch(`${baseUrl}/api/health`);
            const data = await response.json();
            setHealth(data);
        } catch (error) {
            setHealth({
                status: "down",
                timestamp: new Date().toISOString(),
                supabase: {
                    connected: false,
                    error: "Failed to connect to backend server",
                },
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkHealth();
        // Check health every 30 seconds
        const interval = setInterval(checkHealth, 30000);
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = () => {
        if (!health) return theme.textSecondary;
        switch (health.status) {
            case "ok":
                return theme.success;
            case "degraded":
                return theme.warning;
            case "down":
                return theme.error;
            default:
                return theme.textSecondary;
        }
    };

    const getStatusIcon = () => {
        if (isLoading) return "loader";
        if (!health) return "alert-circle";
        switch (health.status) {
            case "ok":
                return "check-circle";
            case "degraded":
                return "alert-triangle";
            case "down":
                return "x-circle";
            default:
                return "help-circle";
        }
    };

    const getStatusText = () => {
        if (isLoading) return "Checking...";
        if (!health) return "Unknown";
        switch (health.status) {
            case "ok":
                return "Connected";
            case "degraded":
                return "Degraded";
            case "down":
                return "Offline";
            default:
                return "Unknown";
        }
    };

    return (
        <Card elevation={1} style={styles.container}>
            <Pressable
                style={styles.header}
                onPress={() => setIsExpanded(!isExpanded)}
            >
                <View style={styles.statusRow}>
                    <Feather
                        name={getStatusIcon()}
                        size={16}
                        color={getStatusColor()}
                        style={styles.icon}
                    />
                    <ThemedText type="small" style={{ color: getStatusColor() }}>
                        {getStatusText()}
                    </ThemedText>
                </View>
                <Feather
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={theme.textSecondary}
                />
            </Pressable>

            {isExpanded && health && (
                <View style={styles.details}>
                    <View style={styles.detailRow}>
                        <ThemedText type="small" style={{ color: theme.textSecondary }}>
                            Backend API:
                        </ThemedText>
                        <ThemedText
                            type="small"
                            style={{
                                color: health.status === "down" ? theme.error : theme.success,
                            }}
                        >
                            {health.status === "down" ? "Offline" : "Online"}
                        </ThemedText>
                    </View>

                    {health.supabase && (
                        <View style={styles.detailRow}>
                            <ThemedText type="small" style={{ color: theme.textSecondary }}>
                                Database:
                            </ThemedText>
                            <ThemedText
                                type="small"
                                style={{
                                    color: health.supabase.connected
                                        ? theme.success
                                        : theme.error,
                                }}
                            >
                                {health.supabase.connected ? "Connected" : "Disconnected"}
                            </ThemedText>
                        </View>
                    )}

                    {health.supabase?.error && (
                        <ThemedText
                            type="small"
                            style={{ color: theme.error, marginTop: Spacing.xs }}
                        >
                            Error: {health.supabase.error}
                        </ThemedText>
                    )}

                    <View style={styles.detailRow}>
                        <ThemedText type="small" style={{ color: theme.textSecondary }}>
                            Last checked:
                        </ThemedText>
                        <ThemedText type="small" style={{ color: theme.textSecondary }}>
                            {new Date(health.timestamp).toLocaleTimeString()}
                        </ThemedText>
                    </View>

                    <Pressable
                        style={[styles.refreshButton, { backgroundColor: theme.link }]}
                        onPress={checkHealth}
                    >
                        <Feather name="refresh-cw" size={14} color="#FFFFFF" />
                        <ThemedText
                            type="small"
                            style={{ color: "#FFFFFF", marginLeft: Spacing.xs }}
                        >
                            Refresh
                        </ThemedText>
                    </Pressable>
                </View>
            )}
        </Card>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.md,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    statusRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    icon: {
        marginRight: Spacing.xs,
    },
    details: {
        marginTop: Spacing.md,
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: "rgba(0,0,0,0.1)",
    },
    detailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: Spacing.xs,
    },
    refreshButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: 8,
        marginTop: Spacing.md,
    },
});
