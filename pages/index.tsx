import * as React from 'react'
import QuoteCalculator from '../QuoteCalculator'
import Layout from '../components/Layout'
import NameInput from '../NameInput'

export default function Home() {
  return (
    <Layout>
      <NameInput />
      <QuoteCalculator />
    </Layout>
  )
}
