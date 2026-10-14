import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { GlossaryContext } from './GlossaryTerm';
import MarkdownRenderer from './MarkdownRenderer';

const body = `## The hook

A [[Token|token]] is tiny. The ratio is 16:9 and the time is 10:30.

:::insight
Remember **this**.
:::

:::try-this
Do the math: $2 + 2$.
:::

Read [the primer](article:primer-embeddings) or [arXiv](https://arxiv.org).
`;

describe('MarkdownRenderer', () => {
  it('renders callouts, glossary terms and in-app links', () => {
    const open = vi.fn();
    render(
      <MemoryRouter>
        <GlossaryContext.Provider value={open}>
          <MarkdownRenderer body={body} />
        </GlossaryContext.Provider>
      </MemoryRouter>,
    );
    expect(screen.getByText('Key insight')).toBeInTheDocument();
    expect(screen.getByText('Try this')).toBeInTheDocument();
    const term = screen.getByRole('button', { name: /token: show definition/i });
    fireEvent.click(term);
    expect(open).toHaveBeenCalledWith('Token');
    expect(screen.getByRole('link', { name: 'the primer' })).toHaveAttribute('href', '/article/primer-embeddings');
    expect(screen.getByRole('link', { name: 'arXiv' })).toHaveAttribute('href', 'https://arxiv.org');
    expect(document.body.textContent).toContain('16:9');
    expect(document.body.textContent).toContain('10:30');
    expect(document.querySelector('.katex')).not.toBeNull();
  });
});
