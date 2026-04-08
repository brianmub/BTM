import React from 'react';
import { View, StyleSheet, Modal, Pressable, ScrollView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import QRCode from 'react-native-qrcode-svg';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/Button';
// GlassBox removed as it was not found in the package
import { Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface ReceiptModalProps {
  isVisible: boolean;
  onClose: () => void;
  payment: {
    receiptNumber: string;
    amount: number;
    paymentMethod: string;
    createdAt: string;
    userName: string;
    programName: string;
    organizationName: string;
  };
}

export function ReceiptModal({ isVisible, onClose, payment }: ReceiptModalProps) {
  const { theme } = useTheme();

  const generateHtml = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #333; }
            .header { text-align: center; border-bottom: 2px dashed #eee; padding-bottom: 20px; margin-bottom: 20px; }
            .org-name { font-size: 24px; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; }
            .receipt-label { font-size: 12px; letter-spacing: 2px; color: #666; text-transform: uppercase; }
            .content { margin-bottom: 30px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 15px; }
            .label { color: #888; font-size: 14px; text-transform: uppercase; font-weight: bold; }
            .value { font-size: 16px; font-weight: bold; }
            .amount-row { border-top: 1px solid #eee; border-bottom: 1px solid #eee; padding: 15px 0; margin: 15px 0; color: #000; }
            .amount-value { font-size: 28px; font-weight: bold; }
            .footer { text-align: center; margin-top: 40px; }
            .qr-placeholder { width: 150px; height: 150px; margin: 0 auto 20px; border: 1px solid #eee; padding: 10px; }
            .ref { font-family: monospace; font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="org-name">${payment.organizationName}</div>
            <div class="receipt-label">Official Payment Receipt</div>
          </div>
          <div class="content">
            <div class="row">
              <span class="label">Date</span>
              <span class="value">${new Date(payment.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="row">
              <span class="label">Receipt #</span>
              <span class="value">${payment.receiptNumber}</span>
            </div>
            <div class="row">
              <span class="label">Received From</span>
              <span class="value">${payment.userName}</span>
            </div>
            <div class="row">
              <span class="label">For</span>
              <span class="value">${payment.programName}</span>
            </div>
            <div class="amount-row row">
              <span class="label" style="align-self: center;">Amount Paid</span>
              <span class="amount-value">$${payment.amount.toFixed(2)}</span>
            </div>
            <div class="row">
              <span class="label">Payment Method</span>
              <span class="value" style="text-transform: capitalize;">${payment.paymentMethod}</span>
            </div>
          </div>
          <div class="footer">
            <div class="ref">Verification: ${payment.receiptNumber}</div>
            <p style="font-size: 10px; color: #999; margin-top: 20px;">Thank you for your contribution to the kingdom.</p>
          </div>
        </body>
      </html>
    `;
  };

  const handlePrint = async () => {
    try {
      await Print.printAsync({
        html: generateHtml(),
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleShare = async () => {
    try {
      const { uri } = await Print.printToFileAsync({
        html: generateHtml(),
      });
      console.log('File has been saved to:', uri);
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <ThemedView style={styles.modalContainer}>
          <View style={styles.header}>
            <ThemedText type="h4">Receipt Preview</ThemedText>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={[styles.receiptCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
              <View style={styles.receiptHeader}>
                <ThemedText type="h4" style={styles.orgName}>{payment.organizationName}</ThemedText>
                <ThemedText type="small" style={styles.receiptLabel}>OFFICIAL RECEIPT</ThemedText>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <View>
                  <ThemedText type="small" style={styles.label}>Receipt Number</ThemedText>
                  <ThemedText type="body" style={styles.value}>#{payment.receiptNumber}</ThemedText>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <ThemedText type="small" style={styles.label}>Date</ThemedText>
                  <ThemedText type="body" style={styles.value}>{new Date(payment.createdAt).toLocaleDateString()}</ThemedText>
                </View>
              </View>

              <View style={styles.infoItem}>
                <ThemedText type="small" style={styles.label}>Received From</ThemedText>
                <ThemedText type="h4" style={styles.value}>{payment.userName}</ThemedText>
              </View>

              <View style={styles.infoItem}>
                <ThemedText type="small" style={styles.label}>Allocation</ThemedText>
                <ThemedText type="body" style={styles.value}>{payment.programName}</ThemedText>
              </View>

              <View style={[styles.amountContainer, { backgroundColor: theme.primary + '10' }]}>
                <ThemedText type="small" style={[styles.label, { color: theme.primary }]}>Amount Paid</ThemedText>
                <ThemedText type="h2" style={{ color: theme.primary }}>${payment.amount.toFixed(2)}</ThemedText>
              </View>

              <View style={styles.footer}>
                <View style={styles.qrContainer}>
                  <QRCode value={payment.receiptNumber} size={80} color={theme.text} backgroundColor="transparent" />
                </View>
                <ThemedText type="small" style={styles.verificationCode}>{payment.receiptNumber}</ThemedText>
              </View>
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <Button
              onPress={handlePrint}
              style={[styles.actionButton, { flex: 1 }]}
              variant="outline"
            >
              <Feather name="printer" size={18} color={theme.text} />
              <ThemedText style={{ marginLeft: 8 }}>Print</ThemedText>
            </Button>
            <Button
              onPress={handleShare}
              style={[styles.actionButton, { flex: 1, marginLeft: 12 }]}
            >
              <Feather name="share-2" size={18} color="#FFFFFF" />
              <ThemedText style={{ color: '#FFFFFF', marginLeft: 8 }}>Share PDF</ThemedText>
            </Button>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingBottom: Spacing.xl,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  receiptCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  orgName: {
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  receiptLabel: {
    marginTop: 4,
    opacity: 0.6,
    letterSpacing: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: Spacing.lg,
    borderStyle: 'dashed',
    borderRadius: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  infoItem: {
    marginBottom: Spacing.md,
  },
  label: {
    opacity: 0.5,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
    marginBottom: 2,
  },
  value: {
    fontWeight: '600',
  },
  amountContainer: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  qrContainer: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  verificationCode: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    opacity: 0.6,
  },
  actions: {
    flexDirection: 'row',
    padding: Spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
  },
});
