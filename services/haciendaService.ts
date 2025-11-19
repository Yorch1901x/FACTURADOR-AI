
export const HaciendaService = {
  /**
   * Consulta la información de un contribuyente en la API pública de Hacienda
   * @param cedula Número de identificación sin guiones
   */
  getTaxpayerInfo: async (cedula: string) => {
    try {
      // Limpiar cédula de guiones o espacios
      const cleanId = cedula.replace(/[^0-9]/g, '');
      
      if (cleanId.length < 9) {
        throw new Error("La cédula debe tener al menos 9 dígitos");
      }

      const response = await fetch(`https://api.hacienda.go.cr/fe/ae?identificacion=${cleanId}`);
      
      if (!response.ok) {
        if (response.status === 404) throw new Error("Contribuyente no encontrado.");
        throw new Error("Error al consultar Hacienda.");
      }

      const data = await response.json();
      
      // Mapear el tipo de identificación de Hacienda a nuestros valores
      let idTypeString = '01 Cédula Física';
      const apiType = data.tipoIdentificacion; // "01", "02", etc.

      switch(apiType) {
        case "01": idTypeString = '01 Cédula Física'; break;
        case "02": idTypeString = '02 Cédula Jurídica'; break;
        case "03": idTypeString = '03 DIMEX'; break;
        case "04": idTypeString = '04 NITE'; break;
        default: 
          // Fallback basado en longitud si la API no devuelve tipo claro
          if (cleanId.length === 9) idTypeString = '01 Cédula Física';
          else if (cleanId.length === 10) idTypeString = '02 Cédula Jurídica';
          else idTypeString = '03 DIMEX';
      }

      // Obtener la actividad económica principal (si existe)
      let activity = '';
      if (data.actividades && data.actividades.length > 0) {
        // Buscamos la activa (A) o tomamos la primera
        const active = data.actividades.find((a: any) => a.estado === 'A') || data.actividades[0];
        activity = `${active.codigo} - ${active.descripcion}`;
      }

      return {
        nombre: data.nombre,
        tipoIdentificacion: idTypeString,
        actividadEconomica: activity,
        regimen: data.regimen?.descripcion || 'Tradicional'
      };

    } catch (error) {
      console.error("Hacienda Service Error:", error);
      throw error;
    }
  }
};
