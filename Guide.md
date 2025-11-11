# Documentação de Utilização do TRE ADELE

## Visão Geral

O **ADELE (Advanced Data Environment for Linked Exploration)** é um **Trusted Research Environment (TRE)** desenvolvido no **INESC-ID**, que permite o **uso seguro de dados clínicos e genómicos sensíveis** para investigação científica.  
O ambiente segue o modelo dos **Five Safes** (Safe People, Projects, Settings, Data e Outputs) e garante conformidade com o **EHDS**, **GDPR** e as normas **GA4GH**.

O sistema é composto por:
- **Website:** interface de utilizador para investigadores e fornecedores de dados.  
- **Backoffice:** interface de gestão e validação para operadores e validadores.
- **LS-Login:** serviço de autenticação federada 
- **FAIR Data Point (FDP):** catálogo de metadados dos datasets.  
- **REMS:** sistema de gestão de acessos e autorizações.  
- **TES:** ambiente de execução isolado para análise de dados.

---

## Fluxo de Trabalho para Utilizadores

### 1. Autenticação

1. Aceder ao portal ADELE (`https://website.adele.inesc-id.pt`).
2. Clicar em **Login** e autenticar-se via **LS-Login** com as credenciais institucionais.  
3. Após o login, o sistema associa o utilizador ao seu identificador federado **GA4GH AAI**, utilizado para gerir permissões e acessos em todos os serviços.

---

### 2. Submissão de Dados (Data Provider)

**Objetivo:** enviar dados clínicos/genómicos de forma segura e conforme com os princípios FAIR.

**Passos:**

1. **Criar um projeto** no website:  
   - Definir **título**, **descrição**, **organização associada**, **email do PI (investigador principal)** — por defeito é o do utilizador que cria o projeto, mas pode ser alterado.  
   - Indicar a **data de expiração dos dados** (por norma: data atual + 50 anos).

2. **Assinar o Acordo Legal (Data Processing Agreement)**  
   - Fazer download dos documentos em PDF.  
   - Assinar e fazer **upload dos documentos assinados** nos campos indicados.

3. **Registar os metadados no FAIR Data Point (FDP)**  
   - Preencher o formulário segundo as indicações com as informações dos dados a submeter.  
   - Os dados do formulário são submetidos diretamente no FDP e o **link do dataset** fica automaticamente associado ao projeto no website.

4. **Encriptar os ficheiros localmente com Crypt4GH**  
   - As instruções passo a passo estão disponíveis na página de upload do website.  
   - O processo gera ficheiros `.c4gh` cifrados com a chave pública do TRE.  
   - Apenas o TRE consegue desencriptar os dados para análise.

5. **Fazer upload dos ficheiros encriptados** através da área do projeto.  
   - O sistema valida automaticamente o cabeçalho Crypt4GH.  
   - Os ficheiros são armazenados de forma segura e ficam prontos para ingestão.

---

### 3. Submissão de Tasks (Investigador)

**Objetivo:** solicitar acesso a datasets e executar pipelines analíticas dentro do TRE.

**Passos:**

1. **Escolher datasets** para análise no **FAIR Data Point** (acessível via website → *Data Discovery*).  
2. Com o nome do dataset, **procurar no REMS** e submeter um pedido de acesso.  
3. **Preencher o formulário de candidatura** em REMS, aceitando os termos e condições.  
4. Após a autorização ser concedida pelo **Data Access Committee (DAC)**, voltar ao website → *My Tasks*.  
5. **Criar uma nova tarefa**:
   - Selecionar o dataset autorizado.  
   - Escolher uma **pipeline** pré-aprovada.  
6. Aguardar o processamento no **Task Execution Service (TES)**.  
7. Quando os resultados estiverem prontos, podem ser consultados diretamente na área da tarefa após **validação do output**.

---

## Fluxo de Trabalho para SysAdmin

### TRE Operator

1. **Validar novos projetos** submetidos (assegurar conformidade com *Safe Projects*).  
2. **Gerir documentação legal:**  
   - Submeter ficheiros para assinatura (globais ou específicos de projeto).  
   - Associar os documentos obrigatórios a cada projeto.  
   - Verificar se as assinaturas foram corretamente submetidas.  
3. **Verificar metadados** no **FAIR Data Point**:
   - Confirmar se a submissão foi bem-sucedida e coerente.  
   - Corrigir ou devolver ao utilizador em caso de inconsistências.  
4. **Autorizar ingestão de dados:**  
   - Garantir que os ficheiros foram carregados encriptados.  
   - Aprovar a sua entrada no armazenamento seguro.

---

### Output Validator

1. Recebe os resultados das análises sem qualquer contexto do projeto (dados anonimizados).  
2. Pode **visualizar os resultados diretamente no ecrã**, mas **não pode descarregar nem copiar** para fora do website.  
3. Analisa o conteúdo para verificar se cumpre o princípio de *Safe Outputs*.  
4. Marca o resultado como:
   - **Seguro para divulgação**, ou  
   - **Rejeitado**, se contiver risco de reidentificação ou fuga de dados.

---

### Administrador

1. Tem acesso às funções de **TRE Operator** e **Output Validator**.  
2. (Futuro) Gerir utilizadores e **roles**:
   - Criar, editar ou remover contas.  
   - Atribuir papéis (investigador, operador, validador, admin).  

---

## Notas
- Para eveitos de teste, todas as authorizações do Backoffice enviam um email (template) para o PI do projeto:
    - Template deve ser melhorado
    - Servico de email atual é apenas para teste, não deve ser utilizado em produção


