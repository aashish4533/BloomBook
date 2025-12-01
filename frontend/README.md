
  # Website Design Request

  This is a code bundle for Website Design Request. The original project is available at https://www.figma.com/design/FsON1BFxAcGWlWeLdNnv6z/Website-Design-Request.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.
  graph TD
    %% Styles matching BookBloom Theme
    classDef primary fill:#C4A672,stroke:#8B7355,color:white,stroke-width:2px;
    classDef secondary fill:#F5F1E8,stroke:#8B7355,color:#2C3E50,stroke-width:1px;
    classDef dark fill:#2C3E50,stroke:#C4A672,color:white;

    User((User)) -->|Log In| Dashboard[User Dashboard]
    class Dashboard primary
    class User dark

    subgraph Main_Features [Core Features]
        direction LR
        Dashboard -->|Buy/Sell| Market[Marketplace]
        Dashboard -->|Rent| Rental[Rental System]
        Dashboard -->|Chat| Comm[Communities]
        Dashboard -->|Learn| Tuition[Tuition Hub]
    end
    class Market,Rental,Comm,Tuition secondary

    Rental -->|Browse| R_Browse[Browse & Filter]
    Rental -->|Select| R_Detail[Book Details]
    Rental -->|Pay| R_Confirm[Confirmation]
    
    class R_Browse,R_Detail,R_Confirm secondary