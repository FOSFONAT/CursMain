using Microsoft.EntityFrameworkCore;
using MyKeep.Api.Models;

namespace MyKeep.Api.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<UserEntity> Users => Set<UserEntity>();
    public DbSet<NoteEntity> Notes => Set<NoteEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserEntity>(entity =>
        {
            entity.ToTable("Users");
            entity.HasKey(user => user.Id);
            entity.Property(user => user.Name).HasMaxLength(60).IsRequired();
            entity.Property(user => user.Email).HasMaxLength(320).IsRequired();
            entity.Property(user => user.PasswordHash).HasMaxLength(500).IsRequired();
            entity.Property(user => user.CreatedAt).HasColumnType("datetimeoffset");
            entity.HasIndex(user => user.Email).IsUnique();
        });

        modelBuilder.Entity<NoteEntity>(entity =>
        {
            entity.ToTable("Notes");
            entity.HasKey(note => note.Id);
            entity.Property(note => note.Title).HasMaxLength(120).IsRequired();
            entity.Property(note => note.Content).HasColumnType("nvarchar(max)").IsRequired();
            entity.Property(note => note.Color).HasMaxLength(20).IsRequired();
            entity.Property(note => note.CreatedAt).HasColumnType("datetimeoffset");
            entity.Property(note => note.UpdatedAt).HasColumnType("datetimeoffset");
            entity.Property(note => note.ExpiresAt).HasColumnType("datetimeoffset");
            entity.HasIndex(note => new { note.UserId, note.UpdatedAt });
            entity.HasIndex(note => note.ExpiresAt)
                .HasFilter("[ExpiresAt] IS NOT NULL");
            entity.HasOne(note => note.User)
                .WithMany(user => user.Notes)
                .HasForeignKey(note => note.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
