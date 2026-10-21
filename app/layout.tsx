import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata={title:{default:'LEX · Lanka Energy Exchange',template:'%s | LEX'},description:'A clearer path to renewable energy procurement in Sri Lanka. Development demonstration with synthetic data.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><a className="skip" href="#main">Skip to content</a>{children}</body></html>}
