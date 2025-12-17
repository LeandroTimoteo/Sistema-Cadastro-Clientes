// Configurações da API
const API_BASE_URL = '/api/clientes';

// Variáveis globais
let currentPage = 1;
let totalPages = 1;
let isEditing = false;
let currentClientId = null;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    loadStats();
    loadClients();
    setupEventListeners();
    setupFormMasks();
});

// Configurar event listeners
function setupEventListeners() {
    // Formulário
    document.getElementById('client-form').addEventListener('submit', handleFormSubmit);
    
    // Busca
    document.getElementById('search-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchClients();
        }
    });
    
    // CEP
    document.getElementById('cep').addEventListener('blur', buscarCEP);
    
    // Modal
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('details-modal');
        if (event.target === modal) {
            closeModal();
        }
    });
}

// Configurar máscaras de entrada
function setupFormMasks() {
    // Máscara CPF
    document.getElementById('cpf').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        e.target.value = value;
    });
    
    // Máscara CEP
    document.getElementById('cep').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/(\d{5})(\d)/, '$1-$2');
        e.target.value = value;
    });
    
    // Máscara Telefone
    document.getElementById('telefone').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/(\d{2})(\d)/, '($1) $2');
        value = value.replace(/(\d{4})(\d)/, '$1-$2');
        e.target.value = value;
    });
    
    // Máscara Celular
    document.getElementById('celular').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/(\d{2})(\d)/, '($1) $2');
        value = value.replace(/(\d{5})(\d)/, '$1-$2');
        e.target.value = value;
    });
}

// Carregar estatísticas
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/stats`);
        if (!response.ok) throw new Error('Erro ao carregar estatísticas');
        
        const stats = await response.json();
        document.getElementById('total-clients').textContent = stats.total_clientes;
        document.getElementById('active-clients').textContent = stats.clientes_ativos;
        document.getElementById('inactive-clients').textContent = stats.clientes_inativos;
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

// Carregar lista de clientes
async function loadClients(page = 1, search = '') {
    showLoading(true);
    
    try {
        const params = new URLSearchParams({
            page: page,
            per_page: 10
        });
        
        if (search) {
            params.append('search', search);
        }
        
        const response = await fetch(`${API_BASE_URL}?${params}`);
        if (!response.ok) throw new Error('Erro ao carregar clientes');
        
        const data = await response.json();
        displayClients(data.clientes);
        updatePagination(data.current_page, data.pages);
        currentPage = data.current_page;
        totalPages = data.pages;
        
    } catch (error) {
        showAlert('Erro ao carregar clientes: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Exibir clientes na tabela
function displayClients(clients) {
    const tbody = document.getElementById('clients-tbody');
    tbody.innerHTML = '';
    
    if (clients.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Nenhum cliente encontrado</td></tr>';
        return;
    }
    
    clients.forEach(client => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${client.nome_completo}</td>
            <td>${client.email}</td>
            <td>${formatCPF(client.cpf)}</td>
            <td>${client.celular || client.telefone || '-'}</td>
            <td>
                <span class="status-badge ${client.ativo ? 'status-active' : 'status-inactive'}">
                    ${client.ativo ? 'Ativo' : 'Inativo'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-primary btn-sm" onclick="viewClient(${client.id})" title="Ver detalhes">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="editClient(${client.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn ${client.ativo ? 'btn-danger' : 'btn-success'} btn-sm" 
                            onclick="toggleClientStatus(${client.id})" 
                            title="${client.ativo ? 'Desativar' : 'Ativar'}">
                        <i class="fas ${client.ativo ? 'fa-user-times' : 'fa-user-check'}"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteClient(${client.id})" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Atualizar paginação
function updatePagination(currentPage, totalPages) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // Botão anterior
    if (currentPage > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.textContent = 'Anterior';
        prevBtn.onclick = () => loadClients(currentPage - 1, document.getElementById('search-input').value);
        pagination.appendChild(prevBtn);
    }
    
    // Números das páginas
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.className = i === currentPage ? 'active' : '';
            pageBtn.onclick = () => loadClients(i, document.getElementById('search-input').value);
            pagination.appendChild(pageBtn);
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            const dots = document.createElement('span');
            dots.textContent = '...';
            dots.style.padding = '8px';
            pagination.appendChild(dots);
        }
    }
    
    // Botão próximo
    if (currentPage < totalPages) {
        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'Próximo';
        nextBtn.onclick = () => loadClients(currentPage + 1, document.getElementById('search-input').value);
        pagination.appendChild(nextBtn);
    }
}

// Buscar clientes
function searchClients() {
    const search = document.getElementById('search-input').value;
    loadClients(1, search);
}

// Manipular envio do formulário
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = getFormData();
    
    try {
        let response;
        if (isEditing) {
            response = await fetch(`${API_BASE_URL}/${currentClientId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
        } else {
            response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
        }
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Erro ao salvar cliente');
        }
        
        showAlert(isEditing ? 'Cliente atualizado com sucesso!' : 'Cliente cadastrado com sucesso!', 'success');
        resetForm();
        loadClients(currentPage);
        loadStats();
        
    } catch (error) {
        showAlert('Erro: ' + error.message, 'error');
    }
}

// Obter dados do formulário
function getFormData() {
    const formData = {};
    const form = document.getElementById('client-form');
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        if (input.type !== 'hidden' && input.id) {
            let value = input.value.trim();
            
            // Limpar máscaras
            if (input.id === 'cpf') {
                value = value.replace(/\D/g, '');
            } else if (input.id === 'cep') {
                value = value.replace(/\D/g, '');
            }
            
            // Converter valores numéricos
            if (input.id === 'renda_mensal' && value) {
                value = parseFloat(value);
            }
            
            formData[input.id] = value || null;
        }
    });
    
    return formData;
}

// Resetar formulário
function resetForm() {
    document.getElementById('client-form').reset();
    document.getElementById('client-id').value = '';
    document.getElementById('form-title').textContent = 'Cadastrar Cliente';
    document.getElementById('submit-text').textContent = 'Cadastrar Cliente';
    isEditing = false;
    currentClientId = null;
}

// Ver detalhes do cliente
async function viewClient(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`);
        if (!response.ok) throw new Error('Cliente não encontrado');
        
        const client = await response.json();
        showClientDetails(client);
        
    } catch (error) {
        showAlert('Erro ao carregar detalhes: ' + error.message, 'error');
    }
}

// Exibir detalhes do cliente no modal
function showClientDetails(client) {
    const detailsContainer = document.getElementById('client-details');
    
    detailsContainer.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
            <div><strong>Nome:</strong> ${client.nome_completo}</div>
            <div><strong>CPF:</strong> ${formatCPF(client.cpf)}</div>
            <div><strong>RG:</strong> ${client.rg || '-'}</div>
            <div><strong>Data de Nascimento:</strong> ${client.data_nascimento ? formatDate(client.data_nascimento) : '-'}</div>
            <div><strong>Email:</strong> ${client.email}</div>
            <div><strong>Telefone:</strong> ${client.telefone || '-'}</div>
            <div><strong>Celular:</strong> ${client.celular || '-'}</div>
            <div><strong>CEP:</strong> ${client.cep || '-'}</div>
            <div><strong>Endereço:</strong> ${client.endereco || '-'}</div>
            <div><strong>Número:</strong> ${client.numero || '-'}</div>
            <div><strong>Complemento:</strong> ${client.complemento || '-'}</div>
            <div><strong>Bairro:</strong> ${client.bairro || '-'}</div>
            <div><strong>Cidade:</strong> ${client.cidade || '-'}</div>
            <div><strong>Estado:</strong> ${client.estado || '-'}</div>
            <div><strong>Profissão:</strong> ${client.profissao || '-'}</div>
            <div><strong>Empresa:</strong> ${client.empresa || '-'}</div>
            <div><strong>Renda Mensal:</strong> ${client.renda_mensal ? formatCurrency(client.renda_mensal) : '-'}</div>
            <div><strong>Status:</strong> 
                <span class="status-badge ${client.ativo ? 'status-active' : 'status-inactive'}">
                    ${client.ativo ? 'Ativo' : 'Inativo'}
                </span>
            </div>
            <div><strong>Data de Cadastro:</strong> ${formatDateTime(client.data_cadastro)}</div>
        </div>
        ${client.observacoes ? `<div style="margin-top: 15px;"><strong>Observações:</strong><br>${client.observacoes}</div>` : ''}
    `;
    
    document.getElementById('details-modal').style.display = 'block';
}

// Editar cliente
async function editClient(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`);
        if (!response.ok) throw new Error('Cliente não encontrado');
        
        const client = await response.json();
        fillForm(client);
        
    } catch (error) {
        showAlert('Erro ao carregar cliente: ' + error.message, 'error');
    }
}

// Preencher formulário com dados do cliente
function fillForm(client) {
    document.getElementById('client-id').value = client.id;
    document.getElementById('nome_completo').value = client.nome_completo;
    document.getElementById('cpf').value = formatCPF(client.cpf);
    document.getElementById('rg').value = client.rg || '';
    document.getElementById('data_nascimento').value = client.data_nascimento || '';
    document.getElementById('email').value = client.email;
    document.getElementById('telefone').value = client.telefone || '';
    document.getElementById('celular').value = client.celular || '';
    document.getElementById('cep').value = client.cep || '';
    document.getElementById('endereco').value = client.endereco || '';
    document.getElementById('numero').value = client.numero || '';
    document.getElementById('complemento').value = client.complemento || '';
    document.getElementById('bairro').value = client.bairro || '';
    document.getElementById('cidade').value = client.cidade || '';
    document.getElementById('estado').value = client.estado || '';
    document.getElementById('profissao').value = client.profissao || '';
    document.getElementById('empresa').value = client.empresa || '';
    document.getElementById('renda_mensal').value = client.renda_mensal || '';
    document.getElementById('observacoes').value = client.observacoes || '';
    
    document.getElementById('form-title').textContent = 'Editar Cliente';
    document.getElementById('submit-text').textContent = 'Atualizar Cliente';
    isEditing = true;
    currentClientId = client.id;
    
    // Scroll para o formulário
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
}

// Alternar status do cliente
async function toggleClientStatus(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/${id}/toggle-status`, {
            method: 'PATCH'
        });
        
        if (!response.ok) throw new Error('Erro ao alterar status');
        
        showAlert('Status do cliente alterado com sucesso!', 'success');
        loadClients(currentPage);
        loadStats();
        
    } catch (error) {
        showAlert('Erro: ' + error.message, 'error');
    }
}

// Excluir cliente
async function deleteClient(id) {
    if (!confirm('Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Erro ao excluir cliente');
        
        showAlert('Cliente excluído com sucesso!', 'success');
        loadClients(currentPage);
        loadStats();
        
    } catch (error) {
        showAlert('Erro: ' + error.message, 'error');
    }
}

// Buscar CEP
async function buscarCEP() {
    const cep = document.getElementById('cep').value.replace(/\D/g, '');
    
    if (cep.length !== 8) return;
    
    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        
        if (data.erro) {
            showAlert('CEP não encontrado', 'error');
            return;
        }
        
        document.getElementById('endereco').value = data.logradouro || '';
        document.getElementById('bairro').value = data.bairro || '';
        document.getElementById('cidade').value = data.localidade || '';
        document.getElementById('estado').value = data.uf || '';
        
    } catch (error) {
        console.error('Erro ao buscar CEP:', error);
    }
}

// Fechar modal
function closeModal() {
    document.getElementById('details-modal').style.display = 'none';
}

// Exibir/ocultar loading
function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
    document.getElementById('clients-container').style.display = show ? 'none' : 'block';
}

// Exibir alertas
function showAlert(message, type) {
    const alertElement = document.getElementById(`alert-${type}`);
    alertElement.textContent = message;
    alertElement.style.display = 'block';
    
    // Ocultar outros alertas
    const otherType = type === 'success' ? 'error' : 'success';
    document.getElementById(`alert-${otherType}`).style.display = 'none';
    
    // Auto-ocultar após 5 segundos
    setTimeout(() => {
        alertElement.style.display = 'none';
    }, 5000);
}

// Funções de formatação
function formatCPF(cpf) {
    if (!cpf) return '';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

function formatDateTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
}

function formatCurrency(value) {
    if (!value) return '';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

