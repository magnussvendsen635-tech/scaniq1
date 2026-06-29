import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Hr, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'ScanIQ'
const SITE_URL = 'https://scaniq.site'
const SUPPORT_EMAIL = 'scaniqapp1@gmail.com'

interface Props {
  name?: string
}

const WelcomeEmail = ({ name }: Props) => {
  const greeting = name ? `Hi ${name},` : 'Hi there,'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Welcome to ScanIQ – let's get scanning 🚀</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to {SITE_NAME} 🚀</Heading>
          <Text style={text}>{greeting}</Text>
          <Text style={text}>
            Thanks for creating your account! ScanIQ helps you instantly understand
            what's really in your food — calories, macros, additives and more — just
            by snapping a picture.
          </Text>

          <Text style={{ ...text, fontWeight: 600 }}>Here's how to get started:</Text>
          <Section style={{ margin: '0 0 24px' }}>
            <Text style={item}>1. Open ScanIQ and tap the scan button</Text>
            <Text style={item}>2. Point your camera at any meal or product</Text>
            <Text style={item}>3. Get an instant breakdown of nutrition & ingredients</Text>
          </Section>

          <Section style={{ textAlign: 'center', margin: '8px 0 28px' }}>
            <Button style={button} href={SITE_URL}>Open ScanIQ</Button>
          </Section>

          <Hr style={hr} />
          <Text style={text}>
            Questions or feedback? Just reply to this email or write to {SUPPORT_EMAIL} —
            we read every message.
          </Text>
          <Text style={footer}>— Team ScanIQ</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: WelcomeEmail,
  subject: 'Welcome to ScanIQ 🚀',
  displayName: 'Welcome (new signup)',
  previewData: { name: 'Alex' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '24px', fontWeight: 700, color: '#111827', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#374151', lineHeight: '1.6', margin: '0 0 14px' }
const item = { fontSize: '14px', color: '#374151', lineHeight: '1.7', margin: '0 0 4px' }
const hr = { borderColor: '#e5e7eb', margin: '24px 0' }
const button = {
  backgroundColor: '#f97316',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 600,
  borderRadius: '10px',
  padding: '12px 22px',
  textDecoration: 'none',
  display: 'inline-block',
}
const footer = { fontSize: '13px', color: '#6b7280', margin: '24px 0 0' }
