# Instruções para agentes de IA

Estas regras valem para todo o repositório.

## Naves e equipamentos do jogador

Antes de criar, gerar, remodelar, importar ou alterar uma nave de jogador, um equipamento visual, hardpoints, propulsores ou efeitos ligados à nave:

1. Leia integralmente [`docs/SHIP_DESIGN_GUIDE.md`](docs/SHIP_DESIGN_GUIDE.md).
2. Trate esse documento como a especificação visual canônica do projeto.
3. Preserve os seis slots modulares: arma, asas, cockpit, gerador, campo de força e propulsores.
4. Modele bases, molduras, fixadores e conduítes como parte do casco. Equipamentos não podem parecer objetos colados nem atravessar outras peças.
5. Preserve hardpoints para tiro frontal, dois canhões diagonais pequenos e arma traseira.
6. Modele três estados de arma distintos: Canhão Integrado Padrão no slot vazio, Canhão de Plasma equipado e Lança Iônica equipada. Uma arma equipada substitui completamente a anterior.
7. Considere também todas as cartas temporárias descritas em “Melhorias escolhidas durante a partida”. Os hardpoints máximos devem coexistir sem interseções; Tiros Múltiplos repete disparos e não adiciona canhões.
8. Valide a nave nas vistas superior, inferior, lateral, traseira, hangar e no tamanho real da partida.
9. Confira visualmente combinações de equipamentos e melhorias temporárias antes de considerar o trabalho concluído.

Se uma solicitação de modelagem contrariar o guia, siga a solicitação explícita do usuário e registre no resultado qual regra visual foi excepcionalmente alterada.
