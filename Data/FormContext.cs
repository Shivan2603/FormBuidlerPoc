using Microsoft.EntityFrameworkCore;
using FormBuilderApp.Models;

namespace FormBuilderApp.Data
{
    public class FormContext : DbContext
    {
        public FormContext(DbContextOptions<FormContext> options) : base(options) { }

        public DbSet<SubmittedForm> SubmittedForms { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<SubmittedForm>()
            .Property(f => f.SubmissionDate)
            .HasDefaultValueSql("getdate()");
        }
    }
}