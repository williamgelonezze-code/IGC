import { pgTable, serial, varchar, jsonb, timestamp, text, boolean, integer } from "drizzle-orm/pg-core";

export const accessLogs = pgTable("access_logs", {
  id: serial("id").primaryKey(),
  cpf: varchar("cpf", { length: 50 }).notNull(),
  re: varchar("re", { length: 20 }).notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  locationData: jsonb("location_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const systemSettings = pgTable("system_settings", {
  key: varchar("key", { length: 50 }).primaryKey(),
  value: varchar("value", { length: 255 }).notNull(),
  updatedAt: timestamp("created_at").defaultNow().notNull(),
});

export const dejemDocuments = pgTable("dejem_documents", {
  id: serial("id").primaryKey(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileData: text("file_data").notNull(),
  uploadedByCpf: varchar("uploaded_by_cpf", { length: 50 }).notNull(),
  uploadedByRe: varchar("uploaded_by_re", { length: 20 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const apiReports = pgTable("api_reports", {
  id: serial("id").primaryKey(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileData: text("file_data").notNull(),
  cpf: varchar("cpf", { length: 50 }).notNull(),
  re: varchar("re", { length: 20 }).notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditReports = pgTable("audit_reports", {
  id: serial("id").primaryKey(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileData: text("file_data").notNull(),
  validatorCpf: varchar("validator_cpf", { length: 50 }).notNull(),
  validatorRe: varchar("validator_re", { length: 20 }).notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const operationalDocuments = pgTable("operational_documents", {
  id: serial("id").primaryKey(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileData: text("file_data").notNull(),
  fileType: varchar("file_type", { length: 50 }).default("xls").notNull(),
  fileSize: varchar("file_size", { length: 50 }),
  description: text("description"),
  uploadedByCpf: varchar("uploaded_by_cpf", { length: 50 }).notNull(),
  uploadedByRe: varchar("uploaded_by_re", { length: 20 }).notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const operationalDownloads = pgTable("operational_downloads", {
  id: serial("id").primaryKey(),
  documentId: serial("document_id").notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  downloadedByCpf: varchar("downloaded_by_cpf", { length: 50 }).notNull(),
  downloadedByRe: varchar("downloaded_by_re", { length: 20 }).notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  locationData: jsonb("location_data"),
  metadata: jsonb("metadata"),
  downloadedAt: timestamp("downloaded_at").defaultNow().notNull(),
});

export const deletedFilesAudit = pgTable("deleted_files_audit", {
  id: serial("id").primaryKey(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  targetTable: varchar("target_table", { length: 100 }).notNull(),
  recordId: varchar("record_id", { length: 50 }).notNull(),
  fileType: varchar("file_type", { length: 50 }),
  deletedByCpf: varchar("deleted_by_cpf", { length: 50 }).notNull(),
  deletedByRe: varchar("deleted_by_re", { length: 20 }).notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  latitude: varchar("latitude", { length: 50 }),
  longitude: varchar("longitude", { length: 50 }),
  locationData: jsonb("location_data"),
  metadata: jsonb("metadata"),
  deletedAt: timestamp("deleted_at").defaultNow().notNull(),
});

export const pmCadastralRecords = pgTable("pm_cadastral_records", {
  id: serial("id").primaryKey(),
  re: varchar("re", { length: 20 }).notNull(),
  cpf: varchar("cpf", { length: 50 }).notNull(),
  nome: varchar("nome", { length: 255 }).notNull(),
  opm: varchar("opm", { length: 100 }),
  dataTaf: varchar("data_taf", { length: 50 }),
  tafStatus: varchar("taf_status", { length: 50 }).default("APROVADO"),
  dataTat: varchar("data_tat", { length: 50 }),
  tatStatus: varchar("tat_status", { length: 50 }).default("APROVADO"),
  dataInspecaoSaude: varchar("data_inspecao_saude", { length: 50 }),
  inspecaoSaudeStatus: varchar("inspecao_saude_status", { length: 50 }).default("APTO"),
  temRestricaoOperacional: boolean("tem_restricao_operacional").default(false).notNull(),
  restricaoOperacional: text("restricao_operacional"),
  temRestricaoMedica: boolean("tem_restricao_medica").default(false).notNull(),
  restricaoMedica: text("restricao_medica"),
  diasAfastamento: text("dias_afastamento"),
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const igcPmReports = pgTable("igc_pm_reports", {
  id: serial("id").primaryKey(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileData: text("file_data").notNull(),
  uploadedByCpf: varchar("uploaded_by_cpf", { length: 50 }).notNull(),
  uploadedByRe: varchar("uploaded_by_re", { length: 20 }).notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dadosCapProcessados = pgTable("dados_cap_processados", {

  id: serial("id").primaryKey(),
  codigoProcessamento: varchar("codigo_processamento", { length: 100 }).notNull().unique(), // Ex: DADOS_CAP_PROCESSADOS_001
  nomeTabela: varchar("nome_tabela", { length: 100 }).notNull(), // Ex: dados_cap_processados_001
  documentoOrigemId: integer("documento_origem_id"),
  nomeArquivoOrigem: varchar("nome_arquivo_origem", { length: 255 }).notNull(),
  nomeNovoArquivo: varchar("nome_novo_arquivo", { length: 255 }).notNull(),
  novoArquivoXls: text("novo_arquivo_xls").notNull(),
  reValidador: varchar("re_validador", { length: 20 }).notNull(),
  cpfValidador: varchar("cpf_validador", { length: 50 }).notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  latitude: varchar("latitude", { length: 50 }),
  longitude: varchar("longitude", { length: 50 }),
  locationData: jsonb("location_data"),
  metadata: jsonb("metadata"),
  totalLinhasOriginais: integer("total_linhas_originais"),
  totalLinhasProcessadas: integer("total_linhas_processadas"),
  totalBoDuplicados: integer("total_bo_duplicados"),
  dadosProcessados: jsonb("dados_processados"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

