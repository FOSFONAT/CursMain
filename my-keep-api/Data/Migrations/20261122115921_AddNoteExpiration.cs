using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyKeep.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddNoteExpiration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ExpiresAt",
                table: "Notes",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Notes_ExpiresAt",
                table: "Notes",
                column: "ExpiresAt",
                filter: "[ExpiresAt] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Notes_ExpiresAt",
                table: "Notes");

            migrationBuilder.DropColumn(
                name: "ExpiresAt",
                table: "Notes");
        }
    }
}
