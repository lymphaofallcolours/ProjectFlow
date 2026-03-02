import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { App } from './App'

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
    // Status bar shows the default campaign name
    expect(screen.getByText('Untitled Campaign')).toBeInTheDocument()
  })
})
