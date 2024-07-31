using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace FormBuilderApp.Models
{
    public class FormElement
    {
        public int Id { get; set; }
        public string Type { get; set; }
        public string Label { get; set; }
        public string? Placeholder { get; set; }
        public List<string>? Options { get; set; }
    }

    public class SubmittedForm
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public DateTime SubmissionDate { get; set; }

        [JsonIgnore] // Exclude this from JSON serialization to avoid circular references
        public List<FormElement> Elements { get; set; } = new List<FormElement>();

        public string FormData { get; set; } // Store the entire form as JSON
    }
}