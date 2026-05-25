<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260524195141 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE absences (id INT AUTO_INCREMENT NOT NULL, type VARCHAR(50) DEFAULT NULL, motif VARCHAR(255) DEFAULT NULL, date_debut DATE NOT NULL, date_fin DATE NOT NULL, justificatif VARCHAR(255) DEFAULT NULL, statut VARCHAR(50) NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, employe_id INT NOT NULL, INDEX IDX_F9C0EFFF1B65292 (employe_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE affectations (id INT AUTO_INCREMENT NOT NULL, poste VARCHAR(100) DEFAULT NULL, date_debut DATE NOT NULL, date_fin DATE DEFAULT NULL, created_at DATETIME NOT NULL, employe_id INT NOT NULL, service_id INT DEFAULT NULL, INDEX IDX_42091041B65292 (employe_id), INDEX IDX_4209104ED5CA9E6 (service_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE attestations (id INT AUTO_INCREMENT NOT NULL, type VARCHAR(50) NOT NULL, statut VARCHAR(50) NOT NULL, date_demande DATETIME NOT NULL, date_generation DATETIME DEFAULT NULL, pdf_path VARCHAR(255) DEFAULT NULL, signature_chef TINYINT NOT NULL, signature_rh TINYINT NOT NULL, employe_id INT NOT NULL, INDEX IDX_AD5A8CF01B65292 (employe_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE conges (id INT AUTO_INCREMENT NOT NULL, date_debut DATE NOT NULL, date_fin DATE NOT NULL, motif VARCHAR(255) DEFAULT NULL, statut VARCHAR(50) NOT NULL, commentaire LONGTEXT DEFAULT NULL, nombre_jours INT DEFAULT NULL, justificatif VARCHAR(255) DEFAULT NULL, signature_chef TINYINT NOT NULL, signature_rh TINYINT NOT NULL, motif_refus LONGTEXT DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, employe_id INT NOT NULL, INDEX IDX_6327DE3A1B65292 (employe_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE correction_demandes (id INT AUTO_INCREMENT NOT NULL, type_correction VARCHAR(100) NOT NULL, ancienne_valeur JSON DEFAULT NULL, nouvelle_valeur JSON DEFAULT NULL, justification LONGTEXT DEFAULT NULL, commentaire LONGTEXT DEFAULT NULL, statut VARCHAR(50) NOT NULL, date_creation DATETIME NOT NULL, date_traitement DATETIME DEFAULT NULL, motif_refus LONGTEXT DEFAULT NULL, documents_justificatifs JSON DEFAULT NULL, employe_id INT NOT NULL, INDEX IDX_DCC46B551B65292 (employe_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE documents (id INT AUTO_INCREMENT NOT NULL, nom VARCHAR(255) NOT NULL, type VARCHAR(50) NOT NULL, path VARCHAR(255) NOT NULL, mime_type VARCHAR(255) DEFAULT NULL, taille INT DEFAULT NULL, uploaded_at DATETIME NOT NULL, employe_id INT NOT NULL, INDEX IDX_A2B072881B65292 (employe_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE employes (id INT AUTO_INCREMENT NOT NULL, nom VARCHAR(100) NOT NULL, prenom VARCHAR(100) NOT NULL, cin VARCHAR(20) DEFAULT NULL, telephone VARCHAR(20) DEFAULT NULL, adresse LONGTEXT DEFAULT NULL, date_naissance DATE DEFAULT NULL, sexe VARCHAR(10) DEFAULT NULL, situation_familiale VARCHAR(50) DEFAULT NULL, photo VARCHAR(255) DEFAULT NULL, matricule VARCHAR(50) NOT NULL, poste VARCHAR(100) DEFAULT NULL, grade VARCHAR(100) DEFAULT NULL, echelle VARCHAR(50) DEFAULT NULL, date_recrutement DATE DEFAULT NULL, statut VARCHAR(50) DEFAULT NULL, salaire NUMERIC(10, 2) DEFAULT NULL, conjoint VARCHAR(100) DEFAULT NULL, nombre_enfants INT DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, user_id INT DEFAULT NULL, service_id INT DEFAULT NULL, UNIQUE INDEX UNIQ_A94BC0F012B2DC9C (matricule), UNIQUE INDEX UNIQ_A94BC0F0A76ED395 (user_id), INDEX IDX_A94BC0F0ED5CA9E6 (service_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE formations (id INT AUTO_INCREMENT NOT NULL, titre VARCHAR(255) NOT NULL, description LONGTEXT DEFAULT NULL, date_debut DATE NOT NULL, date_fin DATE NOT NULL, lieu VARCHAR(255) DEFAULT NULL, capacite INT DEFAULT NULL, statut VARCHAR(50) NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE formation_participants (formation_id INT NOT NULL, employe_id INT NOT NULL, INDEX IDX_603786EE5200282E (formation_id), INDEX IDX_603786EE1B65292 (employe_id), PRIMARY KEY (formation_id, employe_id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE notifications (id INT AUTO_INCREMENT NOT NULL, titre VARCHAR(255) NOT NULL, message LONGTEXT NOT NULL, type VARCHAR(50) DEFAULT NULL, is_read TINYINT NOT NULL, created_at DATETIME NOT NULL, employe_id INT NOT NULL, INDEX IDX_6000B0D31B65292 (employe_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE services (id INT AUTO_INCREMENT NOT NULL, nom VARCHAR(255) NOT NULL, description LONGTEXT DEFAULT NULL, chef_service_id INT DEFAULT NULL, INDEX IDX_7332E169A37F5B5 (chef_service_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE users (id INT AUTO_INCREMENT NOT NULL, email VARCHAR(180) NOT NULL, roles JSON NOT NULL, password VARCHAR(255) NOT NULL, is_active TINYINT NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, UNIQUE INDEX UNIQ_1483A5E9E7927C74 (email), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE messenger_messages (id BIGINT AUTO_INCREMENT NOT NULL, body LONGTEXT NOT NULL, headers LONGTEXT NOT NULL, queue_name VARCHAR(190) NOT NULL, created_at DATETIME NOT NULL, available_at DATETIME NOT NULL, delivered_at DATETIME DEFAULT NULL, INDEX IDX_75EA56E0FB7336F0E3BD61CE16BA31DBBF396750 (queue_name, available_at, delivered_at, id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE absences ADD CONSTRAINT FK_F9C0EFFF1B65292 FOREIGN KEY (employe_id) REFERENCES employes (id)');
        $this->addSql('ALTER TABLE affectations ADD CONSTRAINT FK_42091041B65292 FOREIGN KEY (employe_id) REFERENCES employes (id)');
        $this->addSql('ALTER TABLE affectations ADD CONSTRAINT FK_4209104ED5CA9E6 FOREIGN KEY (service_id) REFERENCES services (id)');
        $this->addSql('ALTER TABLE attestations ADD CONSTRAINT FK_AD5A8CF01B65292 FOREIGN KEY (employe_id) REFERENCES employes (id)');
        $this->addSql('ALTER TABLE conges ADD CONSTRAINT FK_6327DE3A1B65292 FOREIGN KEY (employe_id) REFERENCES employes (id)');
        $this->addSql('ALTER TABLE correction_demandes ADD CONSTRAINT FK_DCC46B551B65292 FOREIGN KEY (employe_id) REFERENCES employes (id)');
        $this->addSql('ALTER TABLE documents ADD CONSTRAINT FK_A2B072881B65292 FOREIGN KEY (employe_id) REFERENCES employes (id)');
        $this->addSql('ALTER TABLE employes ADD CONSTRAINT FK_A94BC0F0A76ED395 FOREIGN KEY (user_id) REFERENCES users (id)');
        $this->addSql('ALTER TABLE employes ADD CONSTRAINT FK_A94BC0F0ED5CA9E6 FOREIGN KEY (service_id) REFERENCES services (id)');
        $this->addSql('ALTER TABLE formation_participants ADD CONSTRAINT FK_603786EE5200282E FOREIGN KEY (formation_id) REFERENCES formations (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE formation_participants ADD CONSTRAINT FK_603786EE1B65292 FOREIGN KEY (employe_id) REFERENCES employes (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE notifications ADD CONSTRAINT FK_6000B0D31B65292 FOREIGN KEY (employe_id) REFERENCES employes (id)');
        $this->addSql('ALTER TABLE services ADD CONSTRAINT FK_7332E169A37F5B5 FOREIGN KEY (chef_service_id) REFERENCES employes (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE absences DROP FOREIGN KEY FK_F9C0EFFF1B65292');
        $this->addSql('ALTER TABLE affectations DROP FOREIGN KEY FK_42091041B65292');
        $this->addSql('ALTER TABLE affectations DROP FOREIGN KEY FK_4209104ED5CA9E6');
        $this->addSql('ALTER TABLE attestations DROP FOREIGN KEY FK_AD5A8CF01B65292');
        $this->addSql('ALTER TABLE conges DROP FOREIGN KEY FK_6327DE3A1B65292');
        $this->addSql('ALTER TABLE correction_demandes DROP FOREIGN KEY FK_DCC46B551B65292');
        $this->addSql('ALTER TABLE documents DROP FOREIGN KEY FK_A2B072881B65292');
        $this->addSql('ALTER TABLE employes DROP FOREIGN KEY FK_A94BC0F0A76ED395');
        $this->addSql('ALTER TABLE employes DROP FOREIGN KEY FK_A94BC0F0ED5CA9E6');
        $this->addSql('ALTER TABLE formation_participants DROP FOREIGN KEY FK_603786EE5200282E');
        $this->addSql('ALTER TABLE formation_participants DROP FOREIGN KEY FK_603786EE1B65292');
        $this->addSql('ALTER TABLE notifications DROP FOREIGN KEY FK_6000B0D31B65292');
        $this->addSql('ALTER TABLE services DROP FOREIGN KEY FK_7332E169A37F5B5');
        $this->addSql('DROP TABLE absences');
        $this->addSql('DROP TABLE affectations');
        $this->addSql('DROP TABLE attestations');
        $this->addSql('DROP TABLE conges');
        $this->addSql('DROP TABLE correction_demandes');
        $this->addSql('DROP TABLE documents');
        $this->addSql('DROP TABLE employes');
        $this->addSql('DROP TABLE formations');
        $this->addSql('DROP TABLE formation_participants');
        $this->addSql('DROP TABLE notifications');
        $this->addSql('DROP TABLE services');
        $this->addSql('DROP TABLE users');
        $this->addSql('DROP TABLE messenger_messages');
    }
}
