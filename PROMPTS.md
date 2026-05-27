# Prompts

Utilizando o chatgpt para realizar o arquivo de objetivo inicial

## Inicial:

```md
Map a implementation for the topic 1.b, if you cannot read that is the goal, ask me before do anything.

## API

### Stack:

Node.js + TypeScript

### Rules

* Use fastify
* Write unit testing with mocks (jest), controller can't depends on the  services and vice-versa, think like this. Test them individually.
* Erros should be explicit to inform the user, intern fails, stock missing, missing data (evaluate use custom codes plus the common http codes)...
* Success messages should be clear
* Create a solution to avoid duplicate orders
* Create a solution to handle two intentions of order if the item has only one available stock, stock validations should be atomic operations (handle Concurrency).
* By now create a simple auth with login and password (only required for create an order)
* Implement logging for process done in the API
* The user has to able to check the order state
* Use docker for API with PostgreSQL as database

## App

### Stack

React + TypeScript

### Rules:

* Clear user responses on failures and success
* Handle errors to don't  freeze the screen or brake
* Don't want common IA interfaces with generic colors and layouts, so suggest some collors to use or an style guide
* Unit testing for handlers and classes
* UI tests with snapshots
* The user has to able to check the order state
* By now don't need e2e testing

## Rules for all

* Focus on maintainability
* Think about scalability
* Code development best practices
* Create .md file with the implementation plan that you made, it should contain the goals in the pdf and my specifications too
* How install and implement the system is required
* Besides the .md, generate simple diagrams, user actions, UML and flowchart


# Important 

If you have any doubt about the process ask me before do it
```

## Segundo para refatoração

Foi usado no mesmo contexto do anterior

```
Improve the plan using to use turborepo to control the mono repo, and for the API and front-end I want to use shared interfaces for both. Use a shared directory to store to common data that will be used to communicate between the system.
```

## Outros

Acabei perdendo os prompts utilizados dentro do repositório, então não vou conseguir colocar aqui. Mas utilizei o open-spec para realizar o planejamento seguindo o tipo de desenvolmento spec-driven. 

Com as especificações bem definida fui implementando de 2 ou 3 passos no máximo para garantir uma janela de contexto segura. Após implementações da IA fazia as revisões de código e validava os testes. Como tudo ok eu avançava para a implementação seguinte.

Após implementar todos os passos fui fazer os testes finais do sistema e os ajustes que eu achei necessário após as implementações da IA.