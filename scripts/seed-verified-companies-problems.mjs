import pg from "pg";

let connectionString = (
  process.env.DATABASE_URL ||
  "postgresql://postgres:GOPIKANNAN1122@db.jhmnemzgbcwcryzolzbz.supabase.co:5432/postgres"
).split("?")[0];

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function seed() {
  await client.connect();
  console.log("Connected to PostgreSQL for seeding verified companies and challenges.");

  try {
    const defaultOwnerId = "d1aabec0-3b89-4c1d-a33d-a6573224f5c2"; // Sri Gopi Kannan

    const companies = [
      {
        slug: "supabase",
        name: "Supabase",
        industry: "Developer Tools",
        location: "San Francisco, CA & Remote",
        website_url: "https://supabase.com",
        logo_url: "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=128&auto=format&fit=crop&q=80",
        size: "50-200",
        description:
          "Supabase is the open source Firebase alternative. Build production-grade backends in a weekend with Postgres database, Authentication, instant APIs, Edge Functions, Realtime subscriptions, and Storage.",
        tech_stack: ["PostgreSQL", "TypeScript", "Go", "Elixir", "Docker", "Deno"],
        verification_status: "verified",
        is_verified: true,
      },
      {
        slug: "zoho",
        name: "Zoho Corporation",
        industry: "Software & SaaS",
        location: "Chennai, Tamil Nadu, India",
        website_url: "https://www.zoho.com",
        logo_url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=128&auto=format&fit=crop&q=80",
        size: "10,000+",
        description:
          "Zoho Corporation is a leading global technology company crafting software to run entire businesses. With 55+ business applications across CRM, finance, email, HR, and collaboration, Zoho powers over 100 million users worldwide from its R&D headquarters in Tamil Nadu.",
        tech_stack: ["Java", "JavaScript", "Python", "Distributed Systems", "WebAssembly", "React"],
        verification_status: "verified",
        is_verified: true,
      },
      {
        slug: "freshworks",
        name: "Freshworks",
        industry: "Software & SaaS",
        location: "Chennai, India & San Mateo, CA",
        website_url: "https://www.freshworks.com",
        logo_url: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=128&auto=format&fit=crop&q=80",
        size: "5,000+",
        description:
          "Freshworks designs modern, intelligent customer engagement and IT service management software. Products like Freshdesk and Freshservice empower businesses to deliver fast, delightful customer experiences with embedded generative AI.",
        tech_stack: ["Ruby on Rails", "Python", "React", "AWS", "LLMs", "Kafka"],
        verification_status: "verified",
        is_verified: true,
      },
      {
        slug: "postman",
        name: "Postman",
        industry: "Developer Tools",
        location: "Bengaluru, India & San Francisco, CA",
        website_url: "https://www.postman.com",
        logo_url: "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=128&auto=format&fit=crop&q=80",
        size: "1,000+",
        description:
          "Postman is the world's leading API platform, used by more than 30 million developers and 500,000 organizations. It simplifies each step of the API lifecycle and streamlines collaboration so teams create better APIs faster.",
        tech_stack: ["Node.js", "Electron", "Go", "React", "OpenAPI", "Docker"],
        verification_status: "verified",
        is_verified: true,
      },
      {
        slug: "hasura",
        name: "Hasura",
        industry: "Web3 & Cloud",
        location: "Bengaluru, India & San Francisco, CA",
        website_url: "https://hasura.io",
        logo_url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=128&auto=format&fit=crop&q=80",
        size: "200-500",
        description:
          "Hasura makes data access blazingly fast and easy. Hasura connects to databases and microservices to automatically generate instant, secure, real-time GraphQL and REST APIs with granular role-based authorization.",
        tech_stack: ["Haskell", "Rust", "GraphQL", "PostgreSQL", "Go", "Docker"],
        verification_status: "verified",
        is_verified: true,
      },
      {
        slug: "zerodha",
        name: "Zerodha",
        industry: "Fintech",
        location: "Bengaluru, Karnataka, India",
        website_url: "https://zerodha.com",
        logo_url: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=128&auto=format&fit=crop&q=80",
        size: "1,000+",
        description:
          "Zerodha is India's largest retail stockbroker, powering millions of active daily market participants through its Kite trading platform. Built entirely on open-source technologies, Zerodha processes billions in daily market trades with peak reliability.",
        tech_stack: ["Go", "Python", "Vue.js", "PostgreSQL", "Redis", "WebSockets"],
        verification_status: "verified",
        is_verified: true,
      },
      {
        slug: "razorpay",
        name: "Razorpay",
        industry: "Fintech",
        location: "Bengaluru, Karnataka, India",
        website_url: "https://razorpay.com",
        logo_url: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=128&auto=format&fit=crop&q=80",
        size: "3,000+",
        description:
          "Razorpay is India's leading full-stack payments and banking platform for businesses. From payment gateway checkouts and subscription billing to corporate credit cards and neo-banking, Razorpay serves millions of Indian businesses.",
        tech_stack: ["Go", "PHP", "Python", "React", "Kafka", "MySQL", "AWS"],
        verification_status: "verified",
        is_verified: true,
      },
      {
        slug: "swiggy",
        name: "Swiggy",
        industry: "Consumer Tech",
        location: "Bengaluru, Karnataka, India",
        website_url: "https://www.swiggy.com",
        logo_url: "https://images.unsplash.com/photo-1526367790999-0150786686a2?w=128&auto=format&fit=crop&q=80",
        size: "5,000+",
        description:
          "Swiggy is India's leading on-demand convenience platform, delivering food, groceries (Instamart), dining out reservations, and pickup-drop services across 500+ cities powered by deep real-time logistics optimization algorithms.",
        tech_stack: ["Go", "Java", "Kotlin", "React Native", "Redis", "Apache Spark"],
        verification_status: "verified",
        is_verified: true,
      },
      {
        slug: "atlassian",
        name: "Atlassian",
        industry: "Developer Tools",
        location: "Sydney & Bengaluru R&D",
        website_url: "https://www.atlassian.com",
        logo_url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=128&auto=format&fit=crop&q=80",
        size: "10,000+",
        description:
          "Atlassian builds team collaboration and developer productivity software including Jira, Confluence, Trello, and Bitbucket. Thousands of software and business teams worldwide rely on Atlassian to coordinate complex projects.",
        tech_stack: ["Java", "TypeScript", "React", "GraphQL", "AWS", "Microservices"],
        verification_status: "verified",
        is_verified: true,
      },
    ];

    console.log("Upserting companies...");
    const companyIdMap = {};

    for (const c of companies) {
      const res = await client.query(
        `
        INSERT INTO public.companies (
          slug, name, industry, location, website_url, logo_url, size, description, tech_stack, verification_status, is_verified, verified_at, verified_domain, owner_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now(), $12, $13)
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          industry = EXCLUDED.industry,
          location = EXCLUDED.location,
          website_url = EXCLUDED.website_url,
          logo_url = EXCLUDED.logo_url,
          size = EXCLUDED.size,
          description = EXCLUDED.description,
          tech_stack = EXCLUDED.tech_stack,
          verification_status = EXCLUDED.verification_status,
          is_verified = EXCLUDED.is_verified,
          verified_domain = EXCLUDED.verified_domain,
          verified_at = now()
        RETURNING id, slug;
        `,
        [
          c.slug,
          c.name,
          c.industry,
          c.location,
          c.website_url,
          c.logo_url,
          c.size,
          c.description,
          c.tech_stack,
          c.verification_status,
          c.is_verified,
          c.website_url ? new URL(c.website_url).hostname.replace(/^www\./, "") : null,
          defaultOwnerId,
        ]
      );
      companyIdMap[c.slug] = res.rows[0].id;
    }

    console.log("Upserted companies map:", companyIdMap);

    // Seed Real-World Problems
    const problems = [
      {
        company_slug: "freshworks",
        title: "Contextual Omnichannel Support Ticket Deduplication Using Agentic LLMs",
        slug: "freshworks-ticket-deduplication-agentic-llm",
        summary:
          "Develop an intelligent clustering and deduplication system that correlates incoming support complaints across email, WhatsApp, and social media into single customer threads.",
        description: `### Business Context & Challenge
Customer service teams using omnichannel platforms receive tickets when major outages or product bugs occur. A single customer often writes an email, tweets at support, and sends a WhatsApp message within 5 minutes. 

Customer success teams waste up to 35% of their daily time resolving the same underlying query across fragmented tickets.

### Requirements & Objectives
1. **Multi-Channel Ingestion & Vector Embeddings**: Ingest ticket content, generate dense embeddings using modern open embedding models (e.g. FastEmbed / BGE), and compute semantic cosine similarity.
2. **Entity & Account Disambiguation**: Cross-match sender phone numbers, email domains, and contextual account metadata to detect when disparate channels represent the same human.
3. **Agentic Clustering & Auto-Merge Recommendation**: Cluster related incident tickets and propose auto-merge actions to support agents with an explanation rationale.
4. **Sub-100ms Latency**: Streamlined inference suitable for high-throughput webhook ingestion queues.`,
        problem_type: "technical_challenge",
        source_type: "official_company",
        source_title: "Freshworks Developer Challenge 2026",
        source_url: "https://developers.freshworks.com",
        required_skills: ["Python", "LLMs", "Vector Databases", "FastAPI", "NLP"],
        industry: "Software & SaaS",
        difficulty: "Advanced",
        status: "open",
      },
      {
        company_slug: "zoho",
        title: "Offline-First Mobile Sync Conflict Resolution in Low-Bandwidth Rural Deployments",
        slug: "zoho-offline-first-sync-conflict-resolution",
        summary:
          "Design a conflict-free replicated data structure (CRDT) engine for field workforce applications that ensures data integrity when field agents operate in intermittent connectivity.",
        description: `### Real-World Problem
Rural enterprise field representatives (supply chain, agricultural credit assessment, and logistics) frequently operate in remote regions with intermittent 2G or zero network connectivity.

When multiple field staff update shared records (e.g., inventory counts, customer addresses, invoice clearances) offline and later synchronize simultaneously at a depot, conventional last-write-wins approaches cause silent data loss or overwrite crucial field notes.

### Technical Scope
1. **CRDT Implementation**: Implement state-based or operation-based CRDTs (such as Observed-Remove Sets and LWW-Element-Set) in mobile client runtime.
2. **Delta Compression**: Synchronize only differential patches rather than full document payloads to minimize cellular bandwidth.
3. **Audit Trail & Visual Merge**: Provide a transparent visual resolution UI for conflicting human inputs that automated logic cannot safely resolve.`,
        problem_type: "real_world_problem",
        source_type: "community",
        source_title: "Zoho Architecture Whitepaper & Tech Discussions",
        source_url: "https://www.zoho.com/creator/help/offline-mobile-apps.html",
        required_skills: ["CRDTs", "TypeScript", "SQLite", "React Native", "Distributed Systems"],
        industry: "Software & SaaS",
        difficulty: "Advanced",
        status: "open",
      },
      {
        company_slug: "zoho",
        title: "Zero-Latency Real-Time Spreadsheet Computation Engine for Million-Row Web Sheets",
        slug: "zoho-web-spreadsheet-engine-million-rows",
        summary:
          "Build an in-browser WebAssembly-accelerated calculation engine for formula evaluation and dependency graphs across massive tabular datasets.",
        description: `### Real-World Problem
Traditional browser spreadsheets slow down significantly when datasets exceed 100,000 rows with complex nested dependency formulas (VLOOKUP, SUMIFS, dynamic arrays). Garbage collection pauses in standard JavaScript runtimes degrade user scroll performance and formula recalculation speed.

### Solution Requirements
1. **Memory Layout**: Design contiguous column-oriented memory storage in WebAssembly linear memory.
2. **Directed Acyclic Graph (DAG)**: Construct an efficient dependency graph that recalculates only dirty downstream cells upon edits.
3. **Multi-Threaded Evaluation**: Leverage Web Workers with SharedArrayBuffer for parallel formula evaluation.`,
        problem_type: "technical_challenge",
        source_type: "community",
        source_title: "Zoho Office Suite Engineering Research",
        source_url: "https://www.zoho.com/sheet/",
        required_skills: ["WebAssembly", "C++", "Rust", "JavaScript", "Performance Optimization"],
        industry: "Software & SaaS",
        difficulty: "Advanced",
        status: "open",
      },
      {
        company_slug: "supabase",
        title: "Edge Function Cold Starts Under Bursty Global Workloads",
        slug: "supabase-edge-function-cold-start-reduction",
        summary:
          "Optimize serverless runtime pre-warming and V8 isolate pooling to drop p99 cold start latencies below 30ms across distributed edge points of presence.",
        description: `### Real-World Problem
Developers building APIs on edge serverless platforms encounter cold start latency spikes (200ms - 800ms) when infrequently accessed functions are spun up on global edge locations (AWS Lambda@Edge, Cloudflare Workers, Deno Deploy).

For latency-critical applications like authentication webhooks, mobile checkouts, or real-time IoT callbacks, sub-50ms deterministic response times are required.

### Technical Scope
1. **Isolate Snapshotting**: Implement V8 heap snapshot pre-initialization for common framework dependencies (e.g. Supabase JS, Hono, Zod).
2. **Predictive Warming**: Use lightweight machine learning models or probabilistic request scheduling to warm edge isolates just before burst traffic spikes occur.
3. **Benchmarks**: Produce automated load testing benchmarks proving p95 and p99 latency improvements.`,
        problem_type: "technical_challenge",
        source_type: "community",
        source_title: "Supabase GitHub Discussions & Edge Runtime Architecture",
        source_url: "https://github.com/supabase/edge-runtime",
        required_skills: ["Deno", "Rust", "TypeScript", "V8 Isolates", "Distributed Systems"],
        industry: "Developer Tools",
        difficulty: "Intermediate",
        status: "open",
      },
      {
        company_slug: "zerodha",
        title: "Ultra-Low Latency Order-Book Streaming Compression for High-Frequency Mobile Tickers",
        slug: "zerodha-order-book-binary-streaming-compression",
        summary:
          "Engineer a lightweight binary serialization protocol and delta compression algorithm to broadcast real-time stock market quotes over congested 4G/5G mobile connections.",
        description: `### Real-World Problem
During peak market opening hours (9:15 AM - 10:30 AM IST), millions of Indian retail traders stream live market tick data across thousands of NSE and BSE instruments simultaneously.

Standard JSON WebSocket messages produce excessive packet overhead and mobile device battery drain. Congested cellular networks experience packet drops and delayed tick updates, which can cause retail investors to make decisions on stale price information.

### Objectives
1. **Binary Protocol**: Design a compact binary wire format (Protocol Buffers, FlatBuffers, or custom bit-packing) minimizing tick payload to < 32 bytes per quote.
2. **Delta Encoding**: Transmit only delta changes for price ladders and depth snapshots.
3. **Graceful Degradation**: Dynamically adjust tick frequency and precision when network jitter or packet loss is detected on the mobile client.`,
        problem_type: "real_world_problem",
        source_type: "community",
        source_title: "Zerodha Tech Engineering Blog & Kite Connect API Docs",
        source_url: "https://zerodha.tech",
        required_skills: ["Go", "WebSockets", "Binary Serialization", "Protocol Buffers", "Networking"],
        industry: "Fintech",
        difficulty: "Advanced",
        status: "open",
      },
      {
        company_slug: "razorpay",
        title: "Intelligent Payment Gateway Fallback and Downtime Prediction Engine",
        slug: "razorpay-payment-gateway-fallback-engine",
        summary:
          "Build a real-time anomaly detection pipeline that predicts bank payment gateway degradations and automatically reroutes transactions before failure spikes occur.",
        description: `### Real-World Problem
In digital payment ecosystems with millions of hourly UPI, Netbanking, and Card transactions, specific bank partner gateways experience sudden degradation or unplanned maintenance windows without prior notice.

If transactions continue routing to degraded gateways, success rates plummet, generating high cart abandonment and merchant frustration.

### Technical Goals
1. **Streaming Anomaly Detection**: Process continuous transaction event streams via Kafka and compute rolling error-rate sliding windows (10s, 30s, 60s).
2. **Smart Fallback Router**: Dynamically adjust routing weights to direct traffic to alternative issuing banks and payment rails.
3. **Simulated Sandbox**: Provide an interactive simulator demonstrating automatic route switching during injected simulated bank outages.`,
        problem_type: "real_world_problem",
        source_type: "community",
        source_title: "Razorpay Engineering Insights & Payment Reliability Whitepapers",
        source_url: "https://engineering.razorpay.com",
        required_skills: ["Python", "Kafka", "Machine Learning", "FastAPI", "Distributed Systems"],
        industry: "Fintech",
        difficulty: "Intermediate",
        status: "open",
      },
      {
        company_slug: "postman",
        title: "Automated Mock Server Latency and Error Chaos Simulation for Microservices",
        slug: "postman-mock-server-chaos-latency-simulation",
        summary:
          "Create a programmable mock server engine that simulates realistic network jitter, partial failures, and cascading timeouts based on OpenAPI 3.0 specs.",
        description: `### Real-World Problem
Modern microservice architectures rely heavily on mock servers during development and integration testing. However, static mock servers return instant 200 OK responses with deterministic payloads, masking real-world production failure modes such as network latency spikes, transient 503 errors, and circuit breaker trip conditions.

### Solution Requirements
1. **OpenAPI Integration**: Parse OpenAPI 3.0 / 3.1 specifications and automatically generate schema-compliant mock responses.
2. **Chaos Configuration**: Allow developers to inject customizable latency distributions (e.g. Gaussian jitter, p99 spikes) and error injection rates.
3. **Client SDK & Dashboard**: Provide a clean web interface to toggle chaos rules live without restarting mock servers.`,
        problem_type: "technical_challenge",
        source_type: "community",
        source_title: "Postman API Platform & Developer Tooling Docs",
        source_url: "https://blog.postman.com",
        required_skills: ["Node.js", "TypeScript", "OpenAPI", "Docker", "DevOps"],
        industry: "Developer Tools",
        difficulty: "Intermediate",
        status: "open",
      },
      {
        company_slug: "hasura",
        title: "Granular Field-Level Response Caching and Invalidation for Dynamic GraphQL Subscriptions",
        slug: "hasura-granular-field-level-graphql-caching",
        summary:
          "Implement high-performance field-level cache invalidation for real-time GraphQL subscriptions without invalidating unrelated parts of client queries.",
        description: `### Real-World Problem
GraphQL query caching is notoriously difficult because clients request arbitrary shapes and nested relations. When an underlying row in PostgreSQL changes, naive caching engines either invalidate entire cache keys or fail to update dependent subscription connections.

### Technical Scope
1. **Graph Invalidation Map**: Track which query selections depend on which database tables, foreign keys, and rows.
2. **Selective Patching**: When an UPDATE mutation occurs, compute the minimal JSON patch and stream updates over WebSockets only to active client subscriptions interested in that field.
3. **Redis / In-Memory Tier**: Benchmark memory footprint and throughput under 50,000 concurrent active client subscriptions.`,
        problem_type: "technical_challenge",
        source_type: "community",
        source_title: "Hasura Architecture Deep Dives",
        source_url: "https://hasura.io/blog",
        required_skills: ["Rust", "GraphQL", "Redis", "PostgreSQL", "Concurrency"],
        industry: "Web3 & Cloud",
        difficulty: "Advanced",
        status: "open",
      },
      {
        company_slug: "swiggy",
        title: "Multi-Modal Delivery Routing and Fleet Batching Under Extreme Monsoon Rain Conditions",
        slug: "swiggy-monsoon-fleet-routing-optimization",
        summary:
          "Develop an adaptive dispatch algorithm that accounts for dynamic waterlogging, localized road closures, and fluctuating rider availability during severe monsoons.",
        description: `### Real-World Problem
During heavy Indian monsoon downpours, localized urban flooding renders certain road networks impassable for two-wheelers within minutes. 

Standard shortest-path routing algorithms fail, causing delivery delays, stranded riders, and inaccurate ETA promises to hungry customers.

### Solution Requirements
1. **Dynamic Cost Graphs**: Incorporate real-time velocity signals and crowd-sourced flood reports into dynamic Dijkstra or A* routing cost calculations.
2. **Adaptive Batching**: Intelligently batch proximate orders going to the same apartment complex while maintaining warm food freshness guarantees.
3. **Interactive Simulation**: Provide a visual map interface demonstrating dispatch adjustments as rain intensity zones move across city sectors.`,
        problem_type: "innovation_challenge",
        source_type: "community",
        source_title: "Swiggy Bytes Tech Blog on Logistics & AI",
        source_url: "https://bytes.swiggy.com",
        required_skills: ["Python", "Graph Algorithms", "GIS / Spatial Data", "Operations Research", "Data Visualization"],
        industry: "Consumer Tech",
        difficulty: "Intermediate",
        status: "open",
      },
      {
        company_slug: "atlassian",
        title: "Unified Cross-Repository Git Commit Impact Analysis for Distributed Engineering Teams",
        slug: "atlassian-cross-repo-commit-impact-analysis",
        summary:
          "Build an automated dependency graph analyzer that traces breaking API changes across multiple microservice repositories before pull requests are merged.",
        description: `### Real-World Problem
In organizations with hundreds of microservices split across distinct Git repositories, a subtle schema change or deprecated parameter in one service can silently break downstream consumer services upon deployment.

### Solution Requirements
1. **Multi-Repo Code Graphing**: Parse commits and pull request diffs, extracting exported interfaces and API contracts (REST, gRPC, Protobuf).
2. **Impact Radius Visualizer**: Generate an interactive dependency blast radius showing which downstream repositories and services will be impacted.
3. **CI/CD Quality Gate**: Provide a GitHub / Bitbucket action that comments on PRs with breaking contract detection and suggested migration shims.`,
        problem_type: "technical_challenge",
        source_type: "community",
        source_title: "Atlassian Engineering & Developer Productivity Research",
        source_url: "https://www.atlassian.com/engineering",
        required_skills: ["TypeScript", "Git Internals", "AST Parsing", "Graph Theory", "CI/CD"],
        industry: "Developer Tools",
        difficulty: "Intermediate",
        status: "open",
      },
    ];

    console.log("Upserting problems...");
    const problemIdMap = {};

    for (const p of problems) {
      const companyId = companyIdMap[p.company_slug];
      if (!companyId) continue;

      const res = await client.query(
        `
        INSERT INTO public.company_problems (
          company_id, title, slug, summary, description, problem_type, source_type,
          source_title, source_url, required_skills, industry, difficulty, status,
          created_by, verified_at, verified_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (slug) DO UPDATE SET
          title = EXCLUDED.title,
          summary = EXCLUDED.summary,
          description = EXCLUDED.description,
          problem_type = EXCLUDED.problem_type,
          source_type = EXCLUDED.source_type,
          source_title = EXCLUDED.source_title,
          source_url = EXCLUDED.source_url,
          required_skills = EXCLUDED.required_skills,
          industry = EXCLUDED.industry,
          difficulty = EXCLUDED.difficulty,
          status = EXCLUDED.status,
          verified_at = EXCLUDED.verified_at,
          verified_by = EXCLUDED.verified_by
        RETURNING id, slug;
        `,
        [
          companyId,
          p.title,
          p.slug,
          p.summary,
          p.description,
          p.problem_type,
          p.source_type,
          p.source_title,
          p.source_url,
          p.required_skills,
          p.industry,
          p.difficulty,
          p.status,
          defaultOwnerId,
          p.source_type === "official_company" ? new Date().toISOString() : null,
          p.source_type === "official_company" ? defaultOwnerId : null,
        ]
      );
      problemIdMap[p.slug] = res.rows[0].id;
    }

    // Update challenges_count on companies
    for (const [slug, compId] of Object.entries(companyIdMap)) {
      await client.query(
        `
        UPDATE public.companies
        SET challenges_count = (
          SELECT COUNT(*) FROM public.company_problems WHERE company_id = $1
        )
        WHERE id = $1;
        `,
        [compId]
      );
    }

    // Link a sample public solution idea to demonstrate idea -> problem connection
    const sampleProbId = problemIdMap["freshworks-ticket-deduplication-agentic-llm"];
    const freshworksId = companyIdMap["freshworks"];

    if (sampleProbId && freshworksId) {
      await client.query(
        `
        INSERT INTO public.ideas (
          id, creator_id, title, description, problem, solution, category, stage, visibility,
          problem_id, company_id, skills_needed, display_id, created_at, updated_at
        )
        VALUES (
          gen_random_uuid(),
          $1,
          'OmniDesk: Real-Time Vector Deduplication and Cross-Channel Cluster Agent',
          'An intelligent proxy agent that ingests multi-channel customer tickets, matches semantic embeddings with pgvector, and clusters related issues into unified support tickets with automated resolution drafts.',
          'Support teams waste 35% of daily agent hours addressing redundant support queries sent by the same customer over email, WhatsApp, and social media.',
          'OmniDesk uses local FastEmbed models with an asynchronous streaming pipeline to cluster tickets within 80ms and generate context-aware merge recommendations.',
          'Software & SaaS',
          'Idea',
          'public',
          $2,
          $3,
          ARRAY['Python', 'FastAPI', 'Vector Databases', 'NLP'],
          'IDEA-OMNIDESK',
          now(),
          now()
        )
        ON CONFLICT DO NOTHING;
        `,
        [defaultOwnerId, sampleProbId, freshworksId]
      );

      // Increment solutions_count on problem
      await client.query(
        `
        UPDATE public.company_problems
        SET solutions_count = (
          SELECT COUNT(*) FROM public.ideas WHERE problem_id = $1
        )
        WHERE id = $1;
        `,
        [sampleProbId]
      );
    }

    console.log("Seeding verified companies & real-world challenges succeeded!");
  } finally {
    await client.end();
  }
}

seed().catch(console.error);
