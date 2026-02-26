# 🌲 Pinecone Registry
(Generic Long-Term Memory Specification)

## 🧠 System Context: “The Past”
Pinecone is used as the system’s authoritative long-term memory layer.

| Component | Tool | Purpose |
| :--- | :--- | :--- |
| **Mission** | Project Files | "Core identity, business DNA, static context" |
| **Actions** | Workspace Tool (e.g. Notion) | "Active tasks, projects, operational workflow" |
| **Past** | Pinecone | "Historical knowledge, archives, retrieval memory" |
| **Stats** | Analytics DB (e.g. Supabase) | "Metrics, KPIs, financial and performance data" |

**Pinecone should only store information that benefits from:**
*   Long-term recall
*   Semantic search
*   Contextual retrieval without reloading entire documents

## 📂 Document Categories (Required)
Every document ingested into Pinecone must be assigned exactly one of the following categories.

| Category | Definition |
| :--- | :--- |
| **Contract** | "Legal agreements, terms, signed documents" |
| **Proposal** | "Commercial offers, pitches, sales material" |
| **Meeting** | "Call transcripts, summaries, notes" |
| **Research** | "Articles, reports, reference materials" |
| **Internal** | "SOPs, playbooks, internal documentation" |

*These categories should be stored as metadata on every vector entry.*

## 🧬 Metadata Schema (Required)
Each document ingested into Pinecone must include the following metadata fields:
*   `category` → one of the predefined categories above
*   `document_name` → human-readable title
*   `document_id` → stable, unique identifier
*   `description` → brief explanation of content
*   `last_updated` → ISO date string

*This metadata must be retrievable alongside embeddings.*

## 💾 User-Uploaded Documents (Vectorization Ledger)
This table represents the expected structure, not specific content.

| Category | Document Name | Pinecone ID | Description | Last Updated | Vectorization Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Contract** | Example Contract | `contract-example-001` | Executed agreement between two parties. | YYYY-MM-DD | ⏳ Pending / ✅ Done |
| **Proposal** | Example Proposal | `proposal-example-001` | Commercial proposal outlining scope and pricing. | YYYY-MM-DD | ⏳ Pending |

**When a document is updated, the system should:**
1.  Re-embed the document
2.  Upsert using the same `document_id`
3.  Replace prior versions to avoid conflicting memory

## 📚 Pre-Existing / External Knowledge
Some content may originate outside the system (e.g. books, reports, PDFs).

| Category | Content Type | ID Strategy | Notes |
| :--- | :--- | :--- | :--- |
| **Research** | "Long-form documents (PDFs, books)" | Auto-generated UUIDs | Content should be chunked logically (page/section). Updates typically require full re-ingestion. |

**Chunking strategy should prioritize:**
*   Semantic coherence
*   Minimal overlap
*   Fast retrieval with low token usage

## 🔁 Retrieval Rules
**When answering questions:**
1.  Check Pinecone first for relevant historical context
2.  Retrieve only the most relevant chunks
3.  Do not scan full documents unless explicitly requested

*Pinecone is optimized for recall, not raw storage.*

## ✅ Summary for the Model
*   **Pinecone represents everything that has happened in the past.**
*   It contains structured, categorized, and version-controlled knowledge.
*   Always retrieve from Pinecone before reasoning, planning, or decision-making.

## ⚙️ Standard Operating Procedures (SOPs)

### 📄 Vectorization Workflow

Follow this process for all new document ingestion to maintain workspace hygiene and data integrity.

#### 1. Preparation
*   Identify the target document(s).
*   Determine the correct **Category** and **Metadata** (see sections above).

#### 2. Extraction & Batching
*   Extract text content (e.g., using `extract_pdf` for PDFs).
*   Chunk content logically (e.g., by page or section).
*   Generate JSON batch files containing record objects.

#### 3. Ingestion (Upsert)
*   Upsert batches to the `antigravity` index (default namespace: `antigravity` or specific project namespace).
*   Verify successful upsert.

#### 4. Archival (Mandatory)
*   Once vectorization is complete, **MOVE all source files and intermediate artifacts** (PDFs, JSON batches, scripts) to the `Vectorised/` folder.
*   Create a dedicated subfolder for the document (e.g., `Vectorised/document-name/`).
*   **Goal:** Keep the root workspace clean. Only active, non-vectorized files should remain in the main directories.
