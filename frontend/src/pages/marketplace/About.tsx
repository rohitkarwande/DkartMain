import { Link } from "react-router-dom";
import { 
  Search, ShieldCheck, Check, X, 
  TrendingUp, MessageSquare, Layers, Building, ShoppingBag, 
  ClipboardList, Stethoscope, Cpu, HeartHandshake, ShieldAlert 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function About() {
  return (
    <div className="pb-20 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* 1. Hero / Introduction */}
      <section className="relative bg-slate-900 overflow-hidden py-20 md:py-28">
        <div 
          className="absolute inset-0 opacity-10 mix-blend-overlay"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1582750433449-64c382817d85?auto=format&fit=crop&q=80&w=1200')", 
            backgroundSize: "cover", 
            backgroundPosition: "center" 
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/90 to-slate-900"></div>
        <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Text & CTAs */}
            <div className="lg:col-span-7 text-left">
              <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 mb-4 px-3.5 py-1 bg-emerald-400/10 backdrop-blur-sm text-sm font-semibold tracking-wide uppercase">
                B2B Healthcare Marketplace
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6 tracking-tight">
                Transforming Healthcare <br />
                <span className="text-emerald-400 bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Equipment Procurement</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-300 mb-6 font-semibold leading-relaxed">
                Dr's Kart is a multi-tenant B2B healthcare marketplace that connects verified buyers, sellers, and healthcare businesses in one centralized digital ecosystem.
              </p>
              <p className="text-slate-400 mb-10 max-w-2xl leading-relaxed text-base">
                By replacing fragmented communication, tedious supplier searches, and manual record-keeping with a unified online workflow, Dr's Kart streamlines product discovery, verification, real-time negotiation, and inquiries. We make healthcare commerce transparent, secure, and highly efficient.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 shadow-lg shadow-emerald-600/20">
                  <Link to="/search">Explore Marketplace</Link>
                </Button>
                <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 shadow-lg shadow-emerald-600/20">
                  <Link to="/signup">Join Dr's Kart</Link>
                </Button>
              </div>
            </div>

            {/* Right Column: Premium Visual */}
            <div className="lg:col-span-5 relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-30"></div>
              <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-2 overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800" 
                  alt="Modern Healthcare Tech & Collaboration" 
                  className="rounded-xl w-full h-[350px] object-cover filter brightness-95 contrast-105"
                />
                <div className="absolute bottom-6 left-6 right-6 bg-slate-950/80 backdrop-blur-md border border-slate-800 p-4 rounded-xl flex items-center gap-4">
                  <div className="p-2.5 bg-emerald-500/20 rounded-lg text-emerald-400">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm">Enterprise Ready</div>
                    <div className="text-xs text-slate-400">Verified and audited medical suppliers</div>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* 2. "What is Dr's Kart?" Section */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/5 mb-3 px-3 py-0.5">
            About the Platform
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            What is Dr's Kart?
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            Dr's Kart is a digital B2B marketplace designed specifically for the healthcare and medical-equipment industry. 
            The platform brings buyers, sellers, suppliers, distributors, and healthcare businesses together, enabling them to discover products, 
            compare options, communicate directly, negotiate deals, submit requirements, and manage business interactions from a centralized platform.
          </p>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Dr's Kart is more than a product-listing website. It is a <strong>complete business ecosystem</strong> for healthcare-equipment transactions.
          </p>
        </div>
      </section>

      {/* 3. The Problem Dr's Kart Solves Section */}
      <section className="bg-slate-100 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800 py-20 transition-colors">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="outline" className="text-red-500 border-red-500/20 bg-red-500/5 mb-3 px-3 py-0.5">
              The Problem & Solution
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Healthcare Procurement Shouldn't Be Fragmented
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Traditional procurement workflows are slow, offline, and complex. 
              Here is how Dr's Kart transforms standard B2B medical transactions.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            
            {/* Traditional Procurement Block */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl shadow-md">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center">
                  <X className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-xl text-slate-900 dark:text-white">Traditional Procurement</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                  <ShieldAlert className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <span>Searching across multiple vendors with unverified profiles</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                  <ShieldAlert className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <span>Limited product visibility and opaque pricing models</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                  <ShieldAlert className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <span>Scattered communication (WhatsApp, phone, physical visits, and emails)</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                  <ShieldAlert className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <span>Manual and time-consuming price negotiations with no audit trail</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                  <ShieldAlert className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <span>Disconnected records and multiple scattered requirements sheets</span>
                </li>
              </ul>
            </div>

            {/* Dr's Kart Solution Block */}
            <div className="bg-emerald-950/10 dark:bg-emerald-950/20 border border-emerald-500/20 p-8 rounded-2xl shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-bl-lg">
                Modern Method
              </div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center animate-bounce">
                  <Check className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-xl text-slate-900 dark:text-white">With Dr's Kart</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Discover:</strong> Browse verified seller catalogs in a central marketplace</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Compare:</strong> Evaluate equipment models, conditions, and specs side-by-side</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Verify:</strong> Instantly check supplier KYC and business status</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Communicate:</strong> Connect instantly with built-in real-time chat</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Negotiate & Manage:</strong> Propose pricing, submit details, and log inquiries</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* 4. "One Platform. Complete B2B Ecosystem." Grid */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/5 mb-3 px-3 py-0.5">
            Key Capabilities
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            One Platform. Complete B2B Ecosystem.
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            Dr's Kart offers a rich array of digital workflow tools custom-built for professional healthcare equipment commerce.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all group">
            <div className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 flex items-center justify-center mb-4 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/30 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">Verified Businesses</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Enable businesses and sellers to establish trust through structured KYC and organization verification checks.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all group">
            <div className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 flex items-center justify-center mb-4 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/30 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              <Stethoscope className="h-7 w-7" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">Healthcare Marketplace</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Discover medical, clinical, and laboratory equipment from multiple trusted sellers in one unified digital market catalog.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all group">
            <div className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 flex items-center justify-center mb-4 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/30 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">Smart Search & Filtering</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Help buyers instantly filter listings by precise equipment categories, brand names, current location, condition, and budget.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all group">
            <div className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 flex items-center justify-center mb-4 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/30 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">Direct Communication</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Skip third-party intermediaries. Interact directly with sellers and hospital representatives through real-time chat.
            </p>
          </div>

          {/* Card 5 */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all group">
            <div className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 flex items-center justify-center mb-4 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/30 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">Negotiation</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Negotiate unit pricing, warranty periods, shipping, and custom installation terms within organized chat interfaces.
            </p>
          </div>

          {/* Card 6 */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all group">
            <div className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 flex items-center justify-center mb-4 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/30 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              <ClipboardList className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">Service & Product Requests</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Allows healthcare buyers to post specific medical equipment needs or servicing requirements and get quotes directly from sellers.
            </p>
          </div>

          {/* Card 7 */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all group">
            <div className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 flex items-center justify-center mb-4 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/30 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              <Layers className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">Business Dashboards</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Equipped with role-specific workspaces to easily track active deals, list equipment, check chat logs, and review quotes.
            </p>
          </div>

          {/* Card 8 */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all group">
            <div className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 flex items-center justify-center mb-4 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/30 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              <Building className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">Multi-Tenant Architecture</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Provides logical workspace partition and scaling, allowing hospitals and supply chain businesses to operate independently.
            </p>
          </div>
        </div>
      </section>

      {/* 5. "Built for Both Sides of the Marketplace" Split-Layout */}
      <section className="bg-slate-100 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800 py-20 transition-colors">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/5 mb-3 px-3 py-0.5">
              Target Audience
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Built for Both Sides of the Marketplace
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Whether you are an institutional buyer trying to source medical equipment, or a registered manufacturer or vendor wanting to expand sales, Dr's Kart delivers.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* For Buyers Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all flex flex-col justify-between">
              <div>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider text-xs block mb-2">
                  Hospital & Clinic Procurement
                </span>
                <h3 className="font-bold text-2xl text-slate-900 dark:text-white mb-2">For Buyers</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                  "Discover the right healthcare equipment faster."
                </p>
                <div className="border-t border-slate-100 dark:border-slate-800/80 my-4"></div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Discover products from multiple verified suppliers</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Compare new, pre-owned, and refurbished devices</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Establish trust with verified corporate seller profiles</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Inquire and request custom quotes in real time</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Negotiate custom terms, pricing, and services</span>
                  </li>
                </ul>
              </div>
              <Button asChild className="w-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700">
                <Link to="/search">Explore the Marketplace</Link>
              </Button>
            </div>

            {/* For Sellers Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all flex flex-col justify-between">
              <div>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider text-xs block mb-2">
                  Manufacturers, Dealers & Distributers
                </span>
                <h3 className="font-bold text-2xl text-slate-900 dark:text-white mb-2">For Sellers</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                  "Reach the businesses that need your products."
                </p>
                <div className="border-t border-slate-100 dark:border-slate-800/80 my-4"></div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Create professional product catalogs with details</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Promote hospital equipment to targeted corporate buyers</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Keep track of inventory availability states</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Receive instant RFQs (Request For Quotes) & inquiries</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Manage listings and conversations from one dashboard</span>
                  </li>
                </ul>
              </div>
              <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                <Link to="/kyc">Start Selling</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Trust & Verification Section */}
      <section className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden text-center">
          
          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="h-16 w-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="h-8 w-8" />
            </div>
            
            <h2 className="text-3xl font-extrabold mb-4 tracking-tight">
              Built on Trust. Designed for Business.
            </h2>
            <p className="text-slate-300 text-base leading-relaxed mb-8">
              Medical-equipment transactions require solid, reliable business relationships. 
              Dr's Kart integrates verification processes to build a safer, more transparent, and highly structured marketplace environment.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-left border-t border-slate-800 pt-8">
              <div>
                <div className="font-bold text-lg text-emerald-400">KYC Verification</div>
                <p className="text-xs text-slate-400 mt-1">Sellers complete identity and business verification.</p>
              </div>
              <div>
                <div className="font-bold text-lg text-emerald-400">Secure Direct Chat</div>
                <p className="text-xs text-slate-400 mt-1">Audit-ready negotiation records logged on platform.</p>
              </div>
              <div className="col-span-2 md:col-span-1">
                <div className="font-bold text-lg text-emerald-400">Organization Audit</div>
                <p className="text-xs text-slate-400 mt-1">Multi-tenant isolation protects commercial data.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. How Dr's Kart Works (Process Timeline) */}
      <section className="bg-slate-100 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800 py-20 transition-colors">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/5 mb-3 px-3 py-0.5">
              The Process
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              How Dr's Kart Works
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Procuring high-value healthcare equipment has never been more straightforward.
            </p>
          </div>

          {/* Timeline Layout */}
          <div className="max-w-5xl mx-auto relative mt-12">
            
            {/* Desktop timeline horizontal line */}
            <div className="absolute top-[37px] left-[10%] right-[10%] h-0.5 bg-slate-200 dark:bg-slate-800 hidden md:block z-0"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative z-10">
              {/* Step 1 */}
              <div className="flex flex-col items-center md:items-start text-center md:text-left">
                <div className="h-10 w-10 bg-emerald-600 text-white font-bold rounded-full flex items-center justify-center shadow-lg mb-4 mx-auto md:mx-0">
                  01
                </div>
                <h3 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">Discover</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Search, discover, and filter healthcare assets by model, condition, and location.
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center md:items-start text-center md:text-left">
                <div className="h-10 w-10 bg-emerald-600 text-white font-bold rounded-full flex items-center justify-center shadow-lg mb-4 mx-auto md:mx-0">
                  02
                </div>
                <h3 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">Compare</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Analyze technical parameters, photos, warranties, and supplier credentials side-by-side.
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center md:items-start text-center md:text-left">
                <div className="h-10 w-10 bg-emerald-600 text-white font-bold rounded-full flex items-center justify-center shadow-lg mb-4 mx-auto md:mx-0">
                  03
                </div>
                <h3 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">Connect</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Engage directly with the seller organization using real-time secure messenger.
                </p>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col items-center md:items-start text-center md:text-left">
                <div className="h-10 w-10 bg-emerald-600 text-white font-bold rounded-full flex items-center justify-center shadow-lg mb-4 mx-auto md:mx-0">
                  04
                </div>
                <h3 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">Negotiate</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Discuss bulk discounts, setup schedules, custom terms, and agree on pricing.
                </p>
              </div>

              {/* Step 5 */}
              <div className="flex flex-col items-center md:items-start text-center md:text-left">
                <div className="h-10 w-10 bg-emerald-600 text-white font-bold rounded-full flex items-center justify-center shadow-lg mb-4 mx-auto md:mx-0">
                  05
                </div>
                <h3 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">Manage</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Track requirements, active deals, quotes, and catalogs through dedicated dashboards.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 8. Mission & Vision Statements */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Mission Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2.5 h-full bg-emerald-600"></div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 block">
              Core Purpose
            </span>
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">
              Our Mission
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
              Dr's Kart's mission is to simplify and modernize healthcare-equipment procurement by creating a trusted digital ecosystem where businesses can discover products, connect with suppliers, exchange requirements, negotiate opportunities, and manage their marketplace activities from one platform.
            </p>
          </div>

          {/* Vision Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2.5 h-full bg-teal-500"></div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 block">
              The Future
            </span>
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">
              Our Vision
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
              To become the most trusted and reliable digital marketplace for the global healthcare industry, connecting businesses seamlessly and enabling smarter, faster, and more transparent medical equipment procurement.
            </p>
          </div>
        </div>
      </section>

      {/* 9. "Why Businesses Choose Dr's Kart" Section */}
      <section className="bg-slate-100 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800 py-20 transition-colors">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/5 mb-3 px-3 py-0.5">
              Value Focus
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Why Businesses Choose Dr's Kart
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              We focus on building a robust platform that meets standard healthcare enterprise standards.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6 max-w-6xl mx-auto">
            {/* Value 1 */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-sm">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-3">01 / Centralized</span>
              <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">Centralized</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Everything businesses need for healthcare-equipment discovery and supplier interaction in one place.
              </p>
            </div>

            {/* Value 2 */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-sm">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-3">02 / Connected</span>
              <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">Connected</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Bring buyers and sellers together through direct, instant communication and business interactions.
              </p>
            </div>

            {/* Value 3 */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-sm">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-3">03 / Verified</span>
              <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">Verified</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Build greater commercial confidence through structured organization KYC and authentication checks.
              </p>
            </div>

            {/* Value 4 */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-sm">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-3">04 / Flexible</span>
              <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">Flexible</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Supports both traditional product-listings catalog browsing and customized requirement-driven inquiries.
              </p>
            </div>

            {/* Value 5 */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-sm">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-3">05 / B2B Focused</span>
              <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">Business-Focused</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Designed entirely around business transactions rather than standard consumer shopping carts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Technology + Healthcare Positioning Diagram */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="max-w-2xl mx-auto mb-16">
          <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/5 mb-3 px-3 py-0.5">
            Interconnected Core
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            The Three Pillars of Dr's Kart
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
            We align modern tech systems with commercial marketplaces and physical healthcare requirements.
          </p>
        </div>

        {/* Pillars Graphic Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto relative items-stretch">
          
          {/* Pillar 1 */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-md flex flex-col justify-between relative group hover:border-emerald-500/30 transition-all">
            <div className="h-14 w-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Stethoscope className="h-7 w-7" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">Healthcare</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Medical equipment, healthcare businesses, manufacturers, authorized distributors, and hospital procurement departments.
              </p>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-md flex flex-col justify-between relative group hover:border-emerald-500/30 transition-all">
            <div className="h-14 w-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <ShoppingBag className="h-7 w-7" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">Marketplace</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Product discovery search, dynamic listings catalogs, product comparisons, customized direct inquiries, and deal workflows.
              </p>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-md flex flex-col justify-between relative group hover:border-emerald-500/30 transition-all">
            <div className="h-14 w-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Cpu className="h-7 w-7" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">Technology</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Real-time communications engine, multi-tenant databases, vendor verification portals, and business management dashboards.
              </p>
            </div>
          </div>

        </div>
        
        {/* Center Connection Indicator */}
        <div className="mt-8 flex justify-center items-center gap-2 text-emerald-500 text-xs font-bold uppercase tracking-widest">
          <HeartHandshake className="h-5 w-5" />
          <span>Centered around Dr's Kart Marketplace Platform</span>
        </div>
      </section>

      {/* 11. Closing CTA Banner */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-8 md:p-16 text-white text-center shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full filter blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full filter blur-3xl pointer-events-none"></div>
          
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight max-w-3xl mx-auto leading-tight">
            The Smarter Way to Connect Healthcare Businesses
          </h2>
          <p className="text-emerald-100 text-base md:text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            Whether you're looking to source healthcare equipment, showcase your products, find new business opportunities, or connect with verified industry participants, Dr's Kart brings the entire process together in one digital marketplace.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-emerald-700 hover:bg-slate-50 font-bold px-8 shadow-md">
              <Link to="/search">Explore Marketplace</Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="border border-white text-white hover:bg-white/10 hover:text-white font-bold px-8">
              <Link to="/signup">Join Dr's Kart</Link>
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
}
