87 % de l'espace de stockage utilisés … Si votre espace de stockage est saturé, vous ne pourrez plus enregistrer dans Drive, sauvegarder dans Google Photos, ni utiliser Gmail. Profitez de 100 Go de stockage pour 1,99 € 0,49 €/mois pendant 3 mois (tarif personnalisé).
import java.util.ArrayList;
import java.util.List;

public abstract class Character {
    private final int maxHealth;
    private int currentHealth;
    private final String name;
    private static List<Character> allCharacters = new ArrayList<>();

    public Character(String name, int maxHealth) {
        this.name = name;
        this.maxHealth = maxHealth;
        this.currentHealth = maxHealth;
        allCharacters.add(this);
    }

    public int getMaxHealth() {
        return maxHealth;
    }

    public int getCurrentHealth() {
        return currentHealth;
    }

    public String getName() {
        return name;
    }

    public abstract void takeDamage(int damage);

    public abstract void attack(Character target);

    protected void setCurrentHealth(int health) {
        this.currentHealth = health;
    }

    public static String printStatus() {
        StringBuilder sb = new StringBuilder();
        if (allCharacters.isEmpty()) {
            sb.append("------------------------------------------\n");
            sb.append("Nobody's fighting right now !\n");
            sb.append("------------------------------------------\n");
            return sb.toString();
        }
    sb.append("------------------------------------------\n");
    sb.append("Characters currently fighting :\n");
        for (Character c : allCharacters) {
            sb.append(" - ").append(c.toString()).append("\n");
        }
        sb.append("------------------------------------------\n");
        return sb.toString();
    }

    public static Character fight(Character a, Character b) {
        boolean aTurn = true;
        while (a.currentHealth > 0 && b.currentHealth > 0) {
            if (aTurn) {
                a.attack(b);
            } else {
                b.attack(a);
            }
            aTurn = !aTurn;
        }
        return a.currentHealth > 0 ? a : b;
    }

    @Override
    public String toString() {
        if (currentHealth == 0) {
            return name + " : KO";
        }
        return name + " : " + currentHealth + "/" + maxHealth;
    }
}