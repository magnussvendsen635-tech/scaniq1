import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'ScanIQ'
const SUPPORT_EMAIL = 'scaniqapp1@gmail.com'

type Lang = 'da' | 'en'

interface Props {
  language?: Lang
  productName?: string
  price?: string
}

const copy = {
  da: {
    preview: 'Velkommen til ScanIQ Pro – din kvittering',
    hi: 'Hej,',
    intro: 'Tusind tak for dit køb – din konto er nu opgraderet til ScanIQ Pro!',
    featuresHeading: 'Du har nu fuld adgang til alle dine Pro-fordele:',
    features: [
      'Op til 20 scanninger om dagen',
      'Avanceret makro-indsigt',
      'Fremskridtstendenser & eksport',
      'Prioritet på nye funktioner',
    ],
    receiptTitle: 'DIN KVITTERING',
    order: 'Ordre',
    price: 'Pris',
    status: 'Status',
    statusValue: 'Betalt og aktiveret',
    support: (e: string) =>
      `Hvis du har spørgsmål til dit køb, dine scanninger eller din konto, er du altid mere end velkommen til at skrive til vores support på ${e}. Vi sidder klar til at hjælpe dig!`,
    sign: '— Team ScanIQ',
  },
  en: {
    preview: 'Welcome to ScanIQ Pro – your receipt',
    hi: 'Hi there,',
    intro: 'Thank you for your purchase – your account has been successfully upgraded to ScanIQ Pro!',
    featuresHeading: 'You now have full access to all your Pro features:',
    features: [
      'Up to 20 scans per day',
      'Advanced macro insights',
      'Progress trends & exports',
      'Priority new features',
    ],
    receiptTitle: 'YOUR RECEIPT',
    order: 'Order',
    price: 'Price',
    status: 'Status',
    statusValue: 'Paid and activated',
    support: (e: string) =>
      `If you have any questions about your purchase, scans, or account, feel free to reach out to our support team anytime at ${e}. We are always happy to help!`,
    sign: '— Team ScanIQ',
  },
}

const WelcomeReceiptEmail = ({
  language = 'en',
  productName = 'ScanIQ Pro - Yearly',
  price = '$179 / year',
}: Props) => {
  const t = copy[language === 'da' ? 'da' : 'en']
  return (
    <Html lang={language} dir="ltr">
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{SITE_NAME} Pro 🚀</Heading>
          <Text style={text}>{t.hi}</Text>
          <Text style={text}>{t.intro}</Text>
          <Text style={{ ...text, fontWeight: 600 }}>{t.featuresHeading}</Text>
          <Section style={{ margin: '0 0 24px' }}>
            {t.features.map((f, i) => (
              <Text key={i} style={featureItem}>• {f}</Text>
            ))}
          </Section>
          <Hr style={hr} />
          <Section style={receiptBox}>
            <Text style={receiptHeading}>{t.receiptTitle}</Text>
            <Text style={receiptRow}><strong>{t.order}:</strong> {productName}</Text>
            <Text style={receiptRow}><strong>{t.price}:</strong> {price}</Text>
            <Text style={receiptRow}><strong>{t.status}:</strong> {t.statusValue}</Text>
          </Section>
          <Hr style={hr} />
          <Text style={text}>{t.support(SUPPORT_EMAIL)}</Text>
          <Text style={footer}>{t.sign}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: WelcomeReceiptEmail,
  subject: (data: Record<string, any>) =>
    data?.language === 'da'
      ? 'Velkommen til ScanIQ Pro! 🚀 (Din kvittering)'
      : 'Welcome to ScanIQ Pro! 🚀 (Your Receipt)',
  displayName: 'Welcome & Purchase Confirmation',
  previewData: {
    language: 'en',
    productName: 'ScanIQ Pro - Yearly',
    price: '$179 / year',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '24px', fontWeight: 700, color: '#111827', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#374151', lineHeight: '1.6', margin: '0 0 14px' }
const featureItem = { fontSize: '14px', color: '#374151', lineHeight: '1.7', margin: '0 0 4px' }
const hr = { borderColor: '#e5e7eb', margin: '24px 0' }
const receiptBox = { backgroundColor: '#fff7ed', borderRadius: '10px', padding: '16px 18px', margin: '0' }
const receiptHeading = { fontSize: '12px', letterSpacing: '0.08em', color: '#9a3412', fontWeight: 700, margin: '0 0 10px' }
const receiptRow = { fontSize: '14px', color: '#374151', margin: '0 0 6px' }
const footer = { fontSize: '13px', color: '#6b7280', margin: '24px 0 0' }
