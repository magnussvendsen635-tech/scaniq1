/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="da" dir="ltr">
    <Head />
    <Preview>Din bekræftelseskode</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={card}>
          <Heading style={h1}>Bekræft din identitet</Heading>
          <Text style={text}>Brug koden herunder for at bekræfte:</Text>
          <Text style={codeStyle}>{token}</Text>
          <Text style={footer}>
            Koden udløber snart. Hvis du ikke har anmodet om dette, kan du ignorere mailen.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }
const container = { padding: '24px 16px', maxWidth: '560px', margin: '0 auto' }
const card = { backgroundColor: '#F4F0EA', border: '3px solid #0B0E18', borderRadius: '24px', padding: '32px 28px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#0B0E18', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#0B0E18', lineHeight: '1.55', margin: '0 0 18px' }
const codeStyle = { fontFamily: 'ui-monospace, Menlo, Consolas, monospace', fontSize: '28px', fontWeight: 'bold' as const, color: '#FF5A1F', letterSpacing: '6px', margin: '0 0 24px' }
const footer = { fontSize: '12px', color: '#55575d', margin: '28px 0 0' }
