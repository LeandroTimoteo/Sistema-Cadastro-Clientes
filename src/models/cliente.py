from src.database import db
from datetime import datetime

class Cliente(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome_completo = db.Column(db.String(200), nullable=False)
    cpf = db.Column(db.String(14), unique=True, nullable=False)
    rg = db.Column(db.String(20), nullable=True)
    data_nascimento = db.Column(db.Date, nullable=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    telefone = db.Column(db.String(20), nullable=True)
    celular = db.Column(db.String(20), nullable=True)
    
    # Endereço
    cep = db.Column(db.String(10), nullable=True)
    endereco = db.Column(db.String(200), nullable=True)
    numero = db.Column(db.String(10), nullable=True)
    complemento = db.Column(db.String(100), nullable=True)
    bairro = db.Column(db.String(100), nullable=True)
    cidade = db.Column(db.String(100), nullable=True)
    estado = db.Column(db.String(2), nullable=True)
    
    # Informações profissionais
    profissao = db.Column(db.String(100), nullable=True)
    empresa = db.Column(db.String(200), nullable=True)
    renda_mensal = db.Column(db.Float, nullable=True)
    
    # Informações do sistema
    data_cadastro = db.Column(db.DateTime, default=datetime.utcnow)
    ativo = db.Column(db.Boolean, default=True)
    observacoes = db.Column(db.Text, nullable=True)

    def __repr__(self):
        return f'<Cliente {self.nome_completo}>'

    def to_dict(self):
        return {
            'id': self.id,
            'nome_completo': self.nome_completo,
            'cpf': self.cpf,
            'rg': self.rg,
            'data_nascimento': self.data_nascimento.isoformat() if self.data_nascimento else None,
            'email': self.email,
            'telefone': self.telefone,
            'celular': self.celular,
            'cep': self.cep,
            'endereco': self.endereco,
            'numero': self.numero,
            'complemento': self.complemento,
            'bairro': self.bairro,
            'cidade': self.cidade,
            'estado': self.estado,
            'profissao': self.profissao,
            'empresa': self.empresa,
            'renda_mensal': self.renda_mensal,
            'data_cadastro': self.data_cadastro.isoformat() if self.data_cadastro else None,
            'ativo': self.ativo,
            'observacoes': self.observacoes
        }

