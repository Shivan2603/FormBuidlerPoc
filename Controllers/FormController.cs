using Microsoft.AspNetCore.Mvc;
using FormBuilderApp.Data;
using FormBuilderApp.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Text.Json.Serialization;
using System.Text.Json;


namespace FormBuilderApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FormController : ControllerBase
    {
        private readonly FormContext _context;

        public FormController(FormContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<SubmittedForm>>> GetForms()
        {
            return await _context.SubmittedForms.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<SubmittedForm>> GetForm(int id)
        {
            var submittedForm = await _context.SubmittedForms.Include(f => f.Elements).FirstOrDefaultAsync(f => f.Id == id); // Include Elements

            if (submittedForm == null)
                return NotFound();

            return submittedForm; 
        }


        [HttpPost]
        public async Task<ActionResult<SubmittedForm>> PostForm([FromBody] SubmittedForm submittedForm)
        {
            _context.SubmittedForms.Add(submittedForm);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetForm),
            new { id = submittedForm.Id },
            submittedForm
            );
        }



        [HttpPut("{id}")]
        public async Task<IActionResult> PutForm(int id, SubmittedForm submittedForm)
        {
            if (id != submittedForm.Id)
            {
                return BadRequest();
            }
            _context.Entry(submittedForm).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteForm(int id)
        {
            var submittedForm = await _context.SubmittedForms.FindAsync(id);
            if (submittedForm == null)
            {
                return NotFound();
            }
            _context.SubmittedForms.Remove(submittedForm);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}