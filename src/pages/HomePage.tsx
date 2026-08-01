import { Layout } from '@/components/layout/Layout'
import {
  About,
  Clients,
  Contact,
  CTA,
  FAQ,
  Features,
  Hero,
  PartnerProgram,
  Process,
  Projects,
  StandardServices,
} from '@/components/sections'

export function HomePage() {
  return (
    <Layout>
      <Hero />
      <Clients />
      <StandardServices />
      <Features />
      <Projects />
      <Process />
      <PartnerProgram />
      <About />
      <FAQ />
      <Contact />
      <CTA />
    </Layout>
  )
}
