/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({ siteName, confirmationUrl }: MagicLinkEmailProps) => (
  <Html lang="da" dir="ltr">
    <Head />
    <Preview>Dit login-link til {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={card}>
          <Heading style={h1}>Dit login-link</Heading>
          <Text style={text}>
            Tryk på knappen herunder for at logge ind på {siteName}. Linket udløber snart.
          </Text>
          <Button style={button} href={confirmationUrl}>Log ind</Button>
          <Text style={footer}>
            Hvis du ikke har anmodet om dette, kan du roligt ignorere mailen.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }
const container = { padding: '24px 16px', maxWidth: '560px', margin: '0 auto' }
const card = { backgroundColor: '#F4F0EA', border: '3px solid #0B0E18', borderRadius: '24px', padding: '32px 28px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#0B0E18', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#0B0E18', lineHeight: '1.55', margin: '0 0 18px' }
const button = { backgroundColor: '#FF5A1F', color: '#ffffff', fontSize: '15px', fontWeight: 'bold' as const, borderRadius: '999px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block', margin: '8px 0 4px' }
const footer = { fontSize: '12px', color: '#55575d', margin: '28px 0 0' }
