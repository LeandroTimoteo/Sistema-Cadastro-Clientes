from flask import Blueprint, jsonify, request
from src.models.cliente import Cliente
from src.database import db
from datetime import datetime
import re

cliente_bp = Blueprint('cliente', __name__)

def validar_cpf(cpf):
    """Validação básica de CPF"""
    cpf = re.sub(r'[^0-9]', '', cpf)
    if len(cpf) != 11:
        return False
    if cpf == cpf[0] * 11:
        return False
    return True

def validar_email(email):
    """Validação básica de email"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

@cliente_bp.route('/clientes', methods=['GET'])
def get_clientes():
    """Listar todos os clientes"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '', type=str)
        
        query = Cliente.query
        
        if search:
            query = query.filter(
                Cliente.nome_completo.contains(search) |
                Cliente.email.contains(search) |
                Cliente.cpf.contains(search)
            )
        
        clientes = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'clientes': [cliente.to_dict() for cliente in clientes.items],
            'total': clientes.total,
            'pages': clientes.pages,
            'current_page': page
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@cliente_bp.route('/clientes', methods=['POST'])
def create_cliente():
    """Criar novo cliente"""
    try:
        data = request.json
        
        # Validações obrigatórias
        if not data.get('nome_completo'):
            return jsonify({'error': 'Nome completo é obrigatório'}), 400
        
        if not data.get('cpf'):
            return jsonify({'error': 'CPF é obrigatório'}), 400
        
        if not validar_cpf(data['cpf']):
            return jsonify({'error': 'CPF inválido'}), 400
        
        if not data.get('email'):
            return jsonify({'error': 'Email é obrigatório'}), 400
        
        if not validar_email(data['email']):
            return jsonify({'error': 'Email inválido'}), 400
        
        # Verificar se CPF já existe
        cpf_limpo = re.sub(r'[^0-9]', '', data['cpf'])
        if Cliente.query.filter_by(cpf=cpf_limpo).first():
            return jsonify({'error': 'CPF já cadastrado'}), 400
        
        # Verificar se email já existe
        if Cliente.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email já cadastrado'}), 400
        
        # Processar data de nascimento
        data_nascimento = None
        if data.get('data_nascimento'):
            try:
                data_nascimento = datetime.strptime(data['data_nascimento'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Data de nascimento inválida. Use o formato YYYY-MM-DD'}), 400
        
        # Criar cliente
        cliente = Cliente(
            nome_completo=data['nome_completo'],
            cpf=cpf_limpo,
            rg=data.get('rg'),
            data_nascimento=data_nascimento,
            email=data['email'],
            telefone=data.get('telefone'),
            celular=data.get('celular'),
            cep=data.get('cep'),
            endereco=data.get('endereco'),
            numero=data.get('numero'),
            complemento=data.get('complemento'),
            bairro=data.get('bairro'),
            cidade=data.get('cidade'),
            estado=data.get('estado'),
            profissao=data.get('profissao'),
            empresa=data.get('empresa'),
            renda_mensal=data.get('renda_mensal'),
            observacoes=data.get('observacoes')
        )
        
        db.session.add(cliente)
        db.session.commit()
        
        return jsonify(cliente.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@cliente_bp.route('/clientes/<int:cliente_id>', methods=['GET'])
def get_cliente(cliente_id):
    """Obter cliente por ID"""
    try:
        cliente = Cliente.query.get_or_404(cliente_id)
        return jsonify(cliente.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@cliente_bp.route('/clientes/<int:cliente_id>', methods=['PUT'])
def update_cliente(cliente_id):
    """Atualizar cliente"""
    try:
        cliente = Cliente.query.get_or_404(cliente_id)
        data = request.json
        
        # Validações se os campos foram fornecidos
        if 'cpf' in data and data['cpf'] != cliente.cpf:
            if not validar_cpf(data['cpf']):
                return jsonify({'error': 'CPF inválido'}), 400
            
            cpf_limpo = re.sub(r'[^0-9]', '', data['cpf'])
            if Cliente.query.filter_by(cpf=cpf_limpo).filter(Cliente.id != cliente_id).first():
                return jsonify({'error': 'CPF já cadastrado'}), 400
            cliente.cpf = cpf_limpo
        
        if 'email' in data and data['email'] != cliente.email:
            if not validar_email(data['email']):
                return jsonify({'error': 'Email inválido'}), 400
            
            if Cliente.query.filter_by(email=data['email']).filter(Cliente.id != cliente_id).first():
                return jsonify({'error': 'Email já cadastrado'}), 400
            cliente.email = data['email']
        
        # Atualizar outros campos
        if 'nome_completo' in data:
            cliente.nome_completo = data['nome_completo']
        if 'rg' in data:
            cliente.rg = data['rg']
        if 'data_nascimento' in data:
            if data['data_nascimento']:
                try:
                    cliente.data_nascimento = datetime.strptime(data['data_nascimento'], '%Y-%m-%d').date()
                except ValueError:
                    return jsonify({'error': 'Data de nascimento inválida. Use o formato YYYY-MM-DD'}), 400
            else:
                cliente.data_nascimento = None
        
        # Atualizar campos de contato
        for campo in ['telefone', 'celular', 'cep', 'endereco', 'numero', 'complemento', 
                     'bairro', 'cidade', 'estado', 'profissao', 'empresa', 'renda_mensal', 
                     'observacoes', 'ativo']:
            if campo in data:
                setattr(cliente, campo, data[campo])
        
        db.session.commit()
        return jsonify(cliente.to_dict())
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@cliente_bp.route('/clientes/<int:cliente_id>', methods=['DELETE'])
def delete_cliente(cliente_id):
    """Excluir cliente"""
    try:
        cliente = Cliente.query.get_or_404(cliente_id)
        db.session.delete(cliente)
        db.session.commit()
        return '', 204
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@cliente_bp.route('/clientes/<int:cliente_id>/toggle-status', methods=['PATCH'])
def toggle_cliente_status(cliente_id):
    """Ativar/desativar cliente"""
    try:
        cliente = Cliente.query.get_or_404(cliente_id)
        cliente.ativo = not cliente.ativo
        db.session.commit()
        return jsonify(cliente.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@cliente_bp.route('/clientes/stats', methods=['GET'])
def get_stats():
    """Obter estatísticas dos clientes"""
    try:
        total_clientes = Cliente.query.count()
        clientes_ativos = Cliente.query.filter_by(ativo=True).count()
        clientes_inativos = Cliente.query.filter_by(ativo=False).count()
        
        return jsonify({
            'total_clientes': total_clientes,
            'clientes_ativos': clientes_ativos,
            'clientes_inativos': clientes_inativos
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

