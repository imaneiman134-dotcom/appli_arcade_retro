# Conception de la Sécurité : Authentification JWT

Pour sécuriser notre application d'arcade rétro et garantir que les scores sont attribués aux bons utilisateurs, nous adopterons une approche basée sur les **JSON Web Tokens (JWT)**.

## 1. Pourquoi JWT ?
*   **Stateless :** Le serveur n'a pas besoin de stocker les sessions, ce qui facilite la scalabilité.
*   **Sécurité :** Les tokens sont signés numériquement, empêchant toute altération par le client.
*   **Facilité d'intégration :** Parfaitement adapté aux architectures découplées (Frontend React / Backend Spring Boot).

## 2. Flux d'Authentification
1.  L'utilisateur envoie ses identifiants (pseudo/mot de passe) via `/api/utilisateurs/login`.
2.  Le backend valide les identifiants et génère un JWT contenant l'ID et le pseudo de l'utilisateur.
3.  Le JWT est renvoyé au frontend.
4.  Le frontend stocke le JWT dans le `localStorage`.
5.  Pour chaque requête protégée (ex: enregistrer un score), le frontend inclut le JWT dans le header `Authorization: Bearer <token>`.
6.  Le backend valide le token avant d'exécuter l'action.

## 3. Prochaines Étapes d'Implémentation
*   Ajouter la dépendance `spring-boot-starter-security` et `jjwt`.
*   Créer une classe `JwtUtils` pour la génération et la validation des tokens.
*   Mettre en place un `OncePerRequestFilter` pour intercepter et valider les tokens sur chaque requête.
*   Configurer `WebSecurityConfigurerAdapter` pour définir les routes publiques et protégées.
