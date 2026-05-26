/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="da" dir="ltr">
    <Head />
    <Preview>Bekræft din e-mail hos {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={card}>
          <Heading style={h1}>Velkommen til ScanIQ 👋</Heading>
          <Text style={text}>
            Tak fordi du oprettede en konto hos{' '}
            <Link href={siteUrl} style={link}><strong>{siteName}</strong></Link>.
          </Text>
          <Text style={text}>
            Bekræft venligst din e-mailadresse (
            <Link href={`mailto:${recipient}`} style={link}>{recipient}</Link>
            ) ved at trykke på knappen herunder:
          </Text>
          <Button style={button} href={confirmationUrl}>Bekræft e-mail</Button>
          <Text style={footer}>
            Hvis du ikke har oprettet en konto, kan du roligt ignorere denne mail.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }
const container = { padding: '24px 16px', maxWidth: '560px', margin: '0 auto' }
const card = { backgroundColor: '#F4F0EA', border: '3px solid #0B0E18', borderRadius: '24px', padding: '32px 28px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#0B0E18', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#0B0E18', lineHeight: '1.55', margin: '0 0 18px' }
const link = { color: '#0B0E18', textDecoration: 'underline' }
const button = { backgroundColor: '#FF5A1F', color: '#ffffff', fontSize: '15px', fontWeight: 'bold' as const, borderRadius: '999px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block', margin: '8px 0 4px' }
const footer = { fontSize: '12px', color: '#55575d', margin: '28px 0 0' }
