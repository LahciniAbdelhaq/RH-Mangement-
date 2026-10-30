<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260518220305 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE audit_log (id INT AUTO_INCREMENT NOT NULL, action VARCHAR(100) NOT NULL, user_name VARCHAR(150) DEFAULT NULL, details LONGTEXT DEFAULT NULL, timestamp DATETIME NOT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE compliance_record (id INT AUTO_INCREMENT NOT NULL, requirement VARCHAR(200) NOT NULL, status VARCHAR(30) DEFAULT \'Non Conforme\' NOT NULL, deadline DATE DEFAULT NULL, completed_at DATE DEFAULT NULL, notes LONGTEXT DEFAULT NULL, created_at DATETIME NOT NULL, employee_id INT NOT NULL, INDEX IDX_772C6FF58C03F15C (employee_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE employee (id INT AUTO_INCREMENT NOT NULL, first_name VARCHAR(100) NOT NULL, last_name VARCHAR(100) NOT NULL, email VARCHAR(180) NOT NULL, role VARCHAR(150) DEFAULT NULL, department VARCHAR(150) DEFAULT NULL, contract_type VARCHAR(50) DEFAULT NULL, phone VARCHAR(30) DEFAULT NULL, base_salary NUMERIC(10, 2) DEFAULT NULL, avatar_bg VARCHAR(7) DEFAULT NULL, hire_date DATE DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, UNIQUE INDEX UNIQ_5D9F75A1E7927C74 (email), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE employee_leave (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(150) NOT NULL, department VARCHAR(150) DEFAULT NULL, type VARCHAR(50) NOT NULL, start_date DATE NOT NULL, end_date DATE NOT NULL, duration VARCHAR(30) DEFAULT NULL, status VARCHAR(20) DEFAULT \'En attente\' NOT NULL, motif LONGTEXT DEFAULT NULL, approved_by VARCHAR(150) DEFAULT NULL, rejection_reason LONGTEXT DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, employee_id INT DEFAULT NULL, INDEX IDX_73BD8DA98C03F15C (employee_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE hr_request (id INT AUTO_INCREMENT NOT NULL, title VARCHAR(200) NOT NULL, sub VARCHAR(200) DEFAULT NULL, description LONGTEXT DEFAULT NULL, status VARCHAR(20) NOT NULL, priority VARCHAR(20) DEFAULT \'Normale\' NOT NULL, owner VARCHAR(150) DEFAULT NULL, department VARCHAR(150) DEFAULT NULL, note LONGTEXT DEFAULT NULL, share_token VARCHAR(64) DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, owner_user_id INT DEFAULT NULL, UNIQUE INDEX UNIQ_D512762AD6594DD6 (share_token), INDEX IDX_D512762A2B18554A (owner_user_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE notification (id INT AUTO_INCREMENT NOT NULL, title VARCHAR(200) NOT NULL, message LONGTEXT NOT NULL, type VARCHAR(20) DEFAULT \'info\' NOT NULL, category VARCHAR(30) DEFAULT NULL, unread TINYINT DEFAULT 1 NOT NULL, created_at DATETIME NOT NULL, recipient_id INT NOT NULL, INDEX IDX_BF5476CAE92F8F78 (recipient_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE `user` (id INT AUTO_INCREMENT NOT NULL, first_name VARCHAR(100) NOT NULL, last_name VARCHAR(100) NOT NULL, email VARCHAR(180) NOT NULL, roles JSON NOT NULL, password VARCHAR(255) NOT NULL, hr_role VARCHAR(50) NOT NULL, title VARCHAR(150) DEFAULT NULL, department VARCHAR(150) DEFAULT NULL, phone VARCHAR(30) DEFAULT NULL, location VARCHAR(200) DEFAULT NULL, contract_type VARCHAR(50) DEFAULT NULL, hire_date DATE DEFAULT NULL, avatar VARCHAR(255) DEFAULT NULL, interim_until DATETIME DEFAULT NULL, annual_leaves_used SMALLINT DEFAULT 0 NOT NULL, annual_leaves_total SMALLINT DEFAULT 22 NOT NULL, sick_leaves_used SMALLINT DEFAULT 0 NOT NULL, sick_leaves_total SMALLINT DEFAULT 8 NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, UNIQUE INDEX UNIQ_8D93D649E7927C74 (email), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE compliance_record ADD CONSTRAINT FK_772C6FF58C03F15C FOREIGN KEY (employee_id) REFERENCES employee (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE employee_leave ADD CONSTRAINT FK_73BD8DA98C03F15C FOREIGN KEY (employee_id) REFERENCES `user` (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE hr_request ADD CONSTRAINT FK_D512762A2B18554A FOREIGN KEY (owner_user_id) REFERENCES `user` (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE notification ADD CONSTRAINT FK_BF5476CAE92F8F78 FOREIGN KEY (recipient_id) REFERENCES `user` (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE compliance_record DROP FOREIGN KEY FK_772C6FF58C03F15C');
        $this->addSql('ALTER TABLE employee_leave DROP FOREIGN KEY FK_73BD8DA98C03F15C');
        $this->addSql('ALTER TABLE hr_request DROP FOREIGN KEY FK_D512762A2B18554A');
        $this->addSql('ALTER TABLE notification DROP FOREIGN KEY FK_BF5476CAE92F8F78');
        $this->addSql('DROP TABLE audit_log');
        $this->addSql('DROP TABLE compliance_record');
        $this->addSql('DROP TABLE employee');
        $this->addSql('DROP TABLE employee_leave');
        $this->addSql('DROP TABLE hr_request');
        $this->addSql('DROP TABLE notification');
        $this->addSql('DROP TABLE `user`');
    }
}
