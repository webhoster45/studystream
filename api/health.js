module.exports = (_request, response) => {
  response.status(200).json({ ok: true, service: 'StudyStream' });
};
